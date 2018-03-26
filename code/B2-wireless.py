#!/usr/bin/env python3

from argparse import ArgumentParser

from asynciojobs import Scheduler

from apssh import SshNode, SshJob
from apssh import Run, RunString
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

node1 = SshNode(gateway = faraday, hostname = "fit01", username = "root",
                verbose = verbose_ssh,
                formatter = TimeColonFormatter())
node2 = SshNode(gateway = faraday, hostname = "fit02", username = "root",
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

####################
# This is our own brewed script for setting up a wifi network
# it run on the remote machine - either sender or receiver
# and is in charge of initializing a small ad-hoc network
#
# Thanks to the RunString class, we can just define this as
# a python string, and pass it arguments from python variables
#

turn_on_wireless_script = """#!/bin/bash

# we expect the following arguments
# * wireless driver name (iwlwifi or ath9k)
# * the wifi network name to join
# * the wifi frequency to use

driver=$1; shift
netname=$1; shift
freq=$1;   shift

# load the r2lab utilities - code can be found here:
# https://github.com/fit-r2lab/r2lab-embedded/blob/master/shell/nodes.sh
source /etc/profile.d/nodes.sh

# make sure to use the latest code on the node
git-pull-r2lab

turn-off-wireless

# local IP address to use is computed on the 10.0.0.0/24
# subnet and based on current node number (using r2lab-ip)
ipaddr_mask=10.0.0.$(r2lab-ip)/24

echo loading module $driver
modprobe $driver

# some time for udev to trigger its rules
sleep 1

# use r2lab tools to figure out the interface name
ifname=$(wait-for-interface-on-driver $driver)

echo configuring interface $ifname
# make sure to wipe down everything first so we can run again and again
ip address flush dev $ifname
ip link set $ifname down
# configure wireless
iw dev $ifname set type ibss
ip link set $ifname up
# set to ad-hoc mode
iw dev $ifname ibss join $netname $freq
ip address add $ipaddr_mask dev $ifname
"""

##########
# setting up the wireless interface on both fit01 and fit02
init_node_01 = SshJob(
    node = node1,
    command = RunString(
        turn_on_wireless_script,
        wireless_driver, "foobar", 2412,
#        verbose=True,
    ),
    required = check_lease,
    scheduler = scheduler,
)
init_node_02 = SshJob(
    node = node2,
    command = RunString(
        turn_on_wireless_script,
        wireless_driver, "foobar", 2412),
    required = check_lease,
    scheduler = scheduler,
)

# the command we want to run in node1 is as simple as it gets
ping = SshJob(
    node = node1,
    required = (init_node_01, init_node_02),
    command = Run(
        'ping', '-c', '20', '10.0.0.2',
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
scheduler.export_as_dotfile("B2.dot")

# return something useful to your OS
exit(0 if success else 1)
