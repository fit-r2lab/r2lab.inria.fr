#!/usr/bin/env python3

import sys, os

import asyncio

from argparse import ArgumentParser

from asynciojobs import Scheduler, Sequence

from apssh import SshNode, SshJob, LocalNode
from apssh import Run, RunString, Push

##########

gateway_hostname  = 'faraday.inria.fr'
gateway_username  = 'root'
verbose_ssh = False
random_size = 2**10
netcat_port = 10000

# this time we want to be able to specify username and verbose_ssh
parser = ArgumentParser()
parser.add_argument("-s", "--slice", default=gateway_username,
                    help="specify an alternate slicename, default={}"
                         .format(gateway_username))
parser.add_argument("-v", "--verbose-ssh", default=False, action='store_true',
                    help="run ssh in verbose mode")
args = parser.parse_args()

gateway_username = args.slice
verbose_ssh = args.verbose_ssh

########## the nodes involved

faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh)

# saying gateway = faraday means to tunnel ssh through the gateway
node1 = SshNode(gateway = faraday, hostname = "fit01", username = "root",
                verbose = verbose_ssh)
node2 = SshNode(gateway = faraday, hostname = "fit02", username = "root",
                verbose = verbose_ssh)

# for convenience, a collection of the nodes
# that we need to initialize
nodes = (node1, node2)

########## create the scheduler instance upfront
scheduler = Scheduler()

check_lease = SshJob(
    node = faraday,
    critical = True,
    command = Run("rhubarbe leases --check"),
    scheduler = scheduler,
)

########## 1 step, generate a random data file of 1 M bytes

create_random_job = SshJob(
    node = LocalNode(),
    commands = [
        Run("head", "-c", random_size, "<", "/dev/random", ">", "RANDOM"),
        Run("ls", "-l", "RANDOM"),
        Run("shasum", "RANDOM"),
        ],
    required = check_lease,
    scheduler = scheduler,
)

########## 2nd step : push this over to node1

push_job = SshJob(
    node = node1,
    commands = [
        Push( localpaths = [ "RANDOM" ],
              remotepath = "."),
        Run("ls -l RANDOM"),
        Run("sha1sum RANDOM"),
    ],
    required = create_random_job,
    scheduler = scheduler,
)

########## step 3 : turn on data interfaces
# a convenient way to create many jobs in a single pass is
# to build a list of jobs using a python comprehension

turn_on_datas = [
    SshJob( node = node,
            command = Run("turn-on-data"),
            required = push_job,
            scheduler = scheduler,
    ) for node in nodes ]

########## next : run a sender on node1 and a receiver on node 2
# in order to transfer RANDOM over a netcat session on the data network

# a Sequence object is a container for jobs, they will have their
# 'required' relationship organized along the sequence order

transfer_job = Sequence(

    # start the receiver - this of course returns immediately
    SshJob(
        node = node2,
        commands = [
            Run("netcat", "-l", "data02", netcat_port, ">", "RANDOM", "&"),
        ],
    ),

    # start the sender
    SshJob(
        node = node1,
        # ignore netcat result
        critical = False,
        commands = [
            # let the server warm up just in case
            Run("sleep 1"),
            Run("netcat", "data02", netcat_port, "<", "RANDOM"),
            Run("echo SENDER DONE"),
        ],
    ),

    # check contents on the receiving end
    SshJob(
        node=node2,
        commands = [
            Run("ls -l RANDOM"),
            Run("sha1sum RANDOM"),
        ],
    ),

    ### these two apply to the Sequence
    # required applies to the first job in the sequence
    required = turn_on_datas,
    # scheduler applies to all jobs in the sequence
    scheduler = scheduler,
)

##########
# run the scheduler
ok = scheduler.orchestrate()

# give details if it failed
ok or scheduler.debrief()

# producing a dot file for illustration
scheduler.export_as_dotfile("C2.dot")

# return something useful to your OS
exit(0 if ok else 1)
