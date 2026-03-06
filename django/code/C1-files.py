#!/usr/bin/env python3

import sys, os

import asyncio

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob, LocalNode
from apssh import Run, RunString, Push

##########

gateway_hostname  = 'faraday.inria.fr'
gateway_username  = 'inria_r2lab.tutorial'
verbose_ssh = False
random_size = 2**10

# this time we want to be able to specify username and verbose_ssh
parser = ArgumentParser()
parser.add_argument("-s", "--slice", default=gateway_username,
                    help="specify an alternate slicename, default={}"
                         .format(gateway_username))
parser.add_argument("-v", "--verbose-ssh", default=False, action='store_true',
                    help="run ssh in verbose mode")
args = parser.parse_args()

# override globals from the command line
gateway_username = args.slice
verbose_ssh = args.verbose_ssh

########## the nodes involved

faraday = SshNode(hostname = gateway_hostname, username = gateway_username,
                  verbose = verbose_ssh)

# saying gateway = faraday means to tunnel ssh through the gateway
node1 = SshNode(gateway = faraday, hostname = "fit01", username = "root",
                verbose = verbose_ssh)

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
    # Using LocalNode() means this will run on our laptop
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

##########
# run the scheduler
ok = scheduler.orchestrate()

# give details if it failed
ok or scheduler.debrief()

# producing a dot file for illustration
scheduler.export_as_dotfile("C1.dot")

# return something useful to your OS
exit(0 if ok else 1)
