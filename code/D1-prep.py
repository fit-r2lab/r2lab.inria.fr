#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob, Run, RunString

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
check_lease = SshJob(
    # checking the lease is done on the gateway
    node = faraday,
    # this means that a failure in any of the commands
    # will cause the scheduler to bail out immediately
    critical = True,
    command = Run("rhubarbe leases --check"),
)

########## user required loading images
if args.load:
    ready_requirement = SshJob(
        node = faraday,
        commands = [
            RunString('xxx'),
        ],
        required = check_lease,
    )
else:
    ready_requirement = check_lease

##########
# setting up the data interface on both fit01 and fit02
init_node_01 = SshJob(node = node1, command = Run("turn-on-data"), required = ready_requirement)
init_node_02 = SshJob(node = node2, command = Run("turn-on-data"), required = ready_requirement)

# the command we want to run in node1 is as simple as it gets
ping = SshJob(
    node = node1,
    # no need to wait for check_release, since both init_node jobs already do
    required = (init_node_01, init_node_02),
    # let's be more specific about what to run
    # we will soon see other things we can do on an ssh connection
    command = Run('ping', '-c1', '-I', 'data', 'data02'),
)

##########
# our orchestration scheduler has 4 jobs to run this time
scheduler = Scheduler(check_lease, ready_requirement, ping, init_node_01, init_node_02)

scheduler.export_as_dotfile("D1.dot")
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

# return something useful to your OS
exit(0 if success else 1)

# producing a dot file for illustration
scheduler.export_as_dotfile("A1.dot")
