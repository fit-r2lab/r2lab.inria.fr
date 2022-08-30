#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob
from apssh import Run

##########
gateway_hostname  = 'faraday.inria.fr'
gateway_username  = 'root'
verbose_ssh = False

parser = ArgumentParser()
parser.add_argument("-s", "--slice", default=gateway_username,
                    help="specify an alternate slicename, default={}"
                         .format(gateway_username))
parser.add_argument("-v", "--verbose-ssh", default=False, action='store_true',
                    help="run ssh in verbose mode")
args = parser.parse_args()

gateway_username = args.slice
verbose_ssh = args.verbose_ssh

##########
faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh)

node1 = SshNode(gateway = faraday, hostname = "fit01", username = "container", port = 2222,
                verbose = verbose_ssh)
node2 = SshNode(gateway = faraday, hostname = "fit02", username = "container", port = 2222,
                verbose = verbose_ssh)

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

# the command we want to run in node1 is as simple as it gets
ping = SshJob(
    node = node1,
    # wait for the 2 init jobs instead
    # check_release is guaranteed to have completed anyway
    required = (check_lease),
    # let's be more specific about what to run
    # we will soon see other things we can do on an ssh connection
    command = Run('ping', '-c1', 'fit02'),
    scheduler = scheduler,
)

##########
# run the scheduler
ok = scheduler.orchestrate()

# give details if it failed
ok or scheduler.debrief()

# we say this is a success if the ping command succeeded
# the result() of the SshJob is the value that the command
# returns to the OS
# so it's a success if this value is 0
success = ok and ping.result() == 0

# producing a dot file for illustration
scheduler.export_as_dotfile("A5.dot")

# return something useful to your OS
exit(0 if success else 1)
