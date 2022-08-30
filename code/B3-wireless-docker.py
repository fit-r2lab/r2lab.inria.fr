#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob
from apssh import Run, RunString, RunScript
from apssh import TimeColonFormatter

##########
gateway_hostname  = 'faraday.inria.fr'
gateway_username  = 'inria_r2lab.tutorial'
verbose_ssh = False

parser = ArgumentParser()
parser.add_argument("-s", "--slice", default=gateway_username,
                    help="specify an alternate slicename, default={}"
                         .format(gateway_username))
parser.add_argument("-v", "--verbose-ssh", default=False, action='store_true',
                    help="run ssh in verbose mode")
parser.add_argument("-d", "--driver", default='ath9k',
                    choices = ['iwlwifi', 'ath9k'],
                    help="specify which driver to use")
args = parser.parse_args()

gateway_username = args.slice
verbose_ssh = args.verbose_ssh
wireless_driver = args.driver

##########
faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh,
                  formatter = TimeColonFormatter())

node1 = SshNode(gateway = faraday, hostname = "fit01", username = "root", port = 2222,
                verbose = verbose_ssh,
                formatter = TimeColonFormatter())
node2 = SshNode(gateway = faraday, hostname = "fit02", username = "root", port = 2222,
                verbose = verbose_ssh,
                formatter = TimeColonFormatter())

##########
# create an orchestration scheduler
scheduler = Scheduler()

##########
check_lease = SshJob(
    # checking the lease is done on the gateway
    node = faraday,
    # this means that a failure in any of the commands
    # will cause the scheduler to bail out immediately
    critical = True,
    command = Run("rhubarbe leases --check"),
    scheduler = scheduler,
)

# the shell script has gone into B3-wireless.sh
####################

##########
# setting up the wireless interface on both fit01 and fit02
init_node_01 = SshJob(
    node = node1,
    # RunString is replaced with RunScript
    command = RunScript(
        # first argument is the local filename
        # where to find the script to run remotely
        "B3-wireless.sh",
        # then its arguments
        "init-ad-hoc-network", wireless_driver, "foobar", 2412,
        # no need to set remote_name with RunScript
    ),
    required = check_lease,
    scheduler = scheduler,
)
init_node_02 = SshJob(
    node = node2,
    command = RunScript(
        "B3-wireless.sh",
        "init-ad-hoc-network", wireless_driver, "foobar", 2412,
        # setting a label to gain space in the graphical output
        label="ditto",
    ),
    required = check_lease,
    scheduler = scheduler,
)

# the command we want to run in node1 is as simple as it gets
ping = SshJob(
    node = node1,
    required = (init_node_01, init_node_02),
    command = RunScript(
        "B3-wireless.sh", "my-ping", '10.0.0.2', 20,
#        verbose=True,
    ),
    scheduler = scheduler,
)

##########
# run the scheduler
ok = scheduler.orchestrate()

# give details if it failed
ok or scheduler.debrief()

success = ok and ping.result() == 0

# producing a dot file for illustration
scheduler.export_as_dotfile("B3.dot")

# return something useful to your OS
exit(0 if success else 1)
