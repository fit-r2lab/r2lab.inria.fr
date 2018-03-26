#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob
from apssh import Run, RunString

##########
gateway_hostname  = 'faraday.inria.fr'
gateway_username  = 'inria_r2lab.tutorial'
verbose_ssh = False

parser = ArgumentParser()
parser.add_argument("-s", "--slice", default=gateway_username,
                    help="specify an alternate slicename, default={}"
                         .format(gateway_username))
parser.add_argument("-l", "--load", default=False, action='store_true',
                    help="load the ubuntu image on nodes before starting")
parser.add_argument("-v", "--verbose-ssh", default=False, action='store_true',
                    help="run ssh in verbose mode")
args = parser.parse_args()

gateway_username = args.slice
verbose_ssh = args.verbose_ssh

##########
faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh)

node1 = SshNode(gateway = faraday, hostname = "fit01", username = "root",
                verbose = verbose_ssh)
node2 = SshNode(gateway = faraday, hostname = "fit02", username = "root",
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

########## has the user requested to load images
# the job to wait before proceeding
ready_requirement = check_lease
if args.load:
    ready_requirement = [
        SshJob(
            node = faraday,
            commands = [
                Run('rhubarbe load -i ubuntu 1 2'),
                Run('rhubarbe wait 1 2'),
                ],
            required = check_lease,
            scheduler = scheduler,
        ),
        SshJob(
            node = faraday,
            commands = [
                Run('rhubarbe bye -a ~1 ~2')
            ],
            required = check_lease,
            scheduler = scheduler,
        )
    ]

##########
# setting up the data interface on both fit01 and fit02
init_node_01 = SshJob(
    node = node1,
    command = Run("turn-on-data"),
    required = ready_requirement,
    scheduler = scheduler,
)
init_node_02 = SshJob(
    node = node2,
    command = Run("turn-on-data"),
    required = ready_requirement,
    scheduler = scheduler,
)

# the command we want to run in node1 is as simple as it gets
ping = SshJob(
    node = node1,
    required = (init_node_01, init_node_02),
    # let's be more specific about what to run
    # we will soon see other things we can do on an ssh connection
    command = Run('ping', '-c1', '-I', 'data', 'data02'),
    scheduler = scheduler,
)

##########
scheduler.export_as_dotfile("D2.dot")
exit(0)

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
scheduler.export_as_dotfile("D2.dot")

# return something useful to your OS
exit(0 if success else 1)
