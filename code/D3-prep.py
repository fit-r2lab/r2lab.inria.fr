#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob
from apssh import Run, RunString

from r2lab import r2lab_hostname, r2lab_data

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
parser.add_argument("-a", "--node-a", default="fit01",
                    help="packets are sent from this node")
parser.add_argument("-b", "--node-b", default="fit02",
                    help="packets are sent to this node")
args = parser.parse_args()

gateway_username = args.slice
verbose_ssh = args.verbose_ssh

##########
faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh)

# r2lab_hostname will accept inputs like '1', '01', or 'fit01'
hostnamea = r2lab_hostname(args.node_a)
hostnameb = r2lab_hostname(args.node_b)

nodea = SshNode(gateway = faraday, hostname = hostnamea, username = "root",
                verbose = verbose_ssh)
nodeb = SshNode(gateway = faraday, hostname = hostnameb, username = "root",
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

# the job to wait before proceeding
ready_requirement = check_lease
# has the user requested to load images ?
# if so, we just need to wait for 2 jobs to complete instead of 1
if args.load:
    ready_requirement = [
        SshJob(
            node = faraday,
            commands = [
                Run('rhubarbe load -i ubuntu', hostamea, hostnameb),
                Run('rhubarbe wait', hostnamea, hostnameb),
                ],
            required = check_lease,
            scheduler = scheduler,
        ),
        SshJob(
            node = faraday,
            commands = [
                Run('rhubarbe bye -a', '~'+hostnamea, '~'+hostnameb)
            ],
            required = check_lease,
            scheduler = scheduler,
        )
    ]

##########
# setting up the data interface on both fit01 and fit02
init_node_a = SshJob(
    node = nodea,
    command = Run("turn-on-data"),
    required = ready_requirement,
    scheduler = scheduler,
)
init_node_b = SshJob(
    node = nodeb,
    command = Run("turn-on-data"),
    required = ready_requirement,
    scheduler = scheduler,
)

# the name of receiver nodeb, on the data network, is e.g. data02
data_b = r2lab_data(hostnameb)

ping = SshJob(
    node = nodea,
    required = (init_node_a, init_node_b),
    # let's be more specific about what to run
    # we will soon see other things we can do on an ssh connection
    command = Run('ping', '-c1', '-I', 'data', data_b),
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
scheduler.export_as_dotfile("D3.dot")

# return something useful to your OS
exit(0 if success else 1)
