#!/usr/bin/env python

# including nepi library and other required packages
from __future__ import print_function
from nepi.execution.ec import ExperimentController
from nepi.execution.resource import ResourceAction, ResourceState
from nepi.util.sshfuncs import logger
import os

# setting up the default host, onelab user and shh key credential
host_gateway  = 'faraday.inria.fr'
user_gateway  = '[your_onelab_user]'
user_identity = '~/.ssh/[your_public_ssh_key]'

# setting up the credentials for the nodes 
host01 = 'fit01'
user01 = 'root'

host02 = 'fit02'
user02 = 'root'

wifi_interface = 'wlan0' 
wifi_channel 	 = '4'
wifi_name      = 'ad-hoc'
wifi_key       = '1234567890'

wifi_net_mask  = '/24'
wifi_ip_fit01	 = '172.16.1.1'
wifi_ip_fit02	 = '172.16.1.2'

# creating a new ExperimentController (EC) to manage the experiment
ec = ExperimentController(exp_id="A4-ping")

# creating the fit01 node
fit01 = ec.register_resource("linux::Node",
                            username = user01,
                            hostname = host01,
# to reach the fit01 node it must go through the gateway, so let's assign the gateway infos
                            gateway = host_gateway,
                            gatewayUser = user_gateway,
                            identity = user_identity,
                            cleanExperiment = True,
                            cleanProcesses = True)
# deploying the fit01 node
ec.deploy(fit01)

# creating the fit02 node
fit02 = ec.register_resource("linux::Node",
                            username = user02,
                            hostname = host02,
# to reach the fit02 node it must go through the gateway, so let's assign the gateway infos
                            gateway = host_gateway,
                            gatewayUser = user_gateway,
                            identity = user_identity,
                            cleanExperiment = True,
                            cleanProcesses = True)
# deploying the fit02 node
ec.deploy(fit02)

# application to setup data interface on fit01 node
app_fit01 = ec.register_resource("linux::Application")
#cmd = 'sudo ip link set dev data down; sudo dhclient data;'
# configuring the ad-hoc for node fit01
cmd  = "ip addr flush dev {}; ".format(wifi_interface)
cmd += "sudo ip link set {} down; ".format(wifi_interface)
cmd += "sudo iwconfig {} mode ad-hoc; ".format(wifi_interface)
cmd += "sudo iwconfig {} channel {}; ".format(wifi_interface, wifi_channel)
cmd += "sudo iwconfig {} essid '{}'; ".format(wifi_interface, wifi_name)
cmd += "sudo iwconfig {} key {}; ".format(wifi_interface, wifi_key)
cmd += "sudo ip link set {} up; ".format(wifi_interface)
cmd += "sudo ip addr add {}{} dev {}; ".format(wifi_ip_fit01, wifi_net_mask, wifi_interface)
ec.set(app_fit01, "command", cmd)
ec.register_connection(app_fit01, fit01)
ec.deploy(app_fit01)
ec.wait_finished(app_fit01)

# application to setup data interface on fit02 node
app_fit02 = ec.register_resource("linux::Application")
#cmd = 'sudo ip link set dev data down; sudo dhclient data;'
# configuring the ad-hoc for node fit01
cmd  = "ip addr flush dev {}; ".format(wifi_interface)
cmd += "sudo ip link set {} down; ".format(wifi_interface)
cmd += "sudo iwconfig {} mode ad-hoc; ".format(wifi_interface)
cmd += "sudo iwconfig {} channel {}; ".format(wifi_interface, wifi_channel)
cmd += "sudo iwconfig {} essid '{}'; ".format(wifi_interface, wifi_name)
cmd += "sudo iwconfig {} key {}; ".format(wifi_interface, wifi_key)
cmd += "sudo ip link set {} up; ".format(wifi_interface)
cmd += "sudo ip addr add {}{} dev {}; ".format(wifi_ip_fit02, wifi_net_mask, wifi_interface)
ec.set(app_fit02, "command", cmd)
ec.register_connection(app_fit02, fit02)
ec.deploy(app_fit02)
ec.wait_finished(app_fit02)

# ping fit02 inteface from fit01
app_ping_from_fit01_to_fit02 = ec.register_resource("linux::Application")
cmd = 'ping -c5 -I {} {}'.format(wifi_interface, wifi_ip_fit02)
ec.set(app_ping_from_fit01_to_fit02, "command", cmd)
ec.register_connection(app_ping_from_fit01_to_fit02, fit01)
ec.deploy(app_ping_from_fit01_to_fit02)
ec.wait_finished(app_ping_from_fit01_to_fit02)

# ping fit01 inteface from fit02
app_ping_from_fit02_to_fit01 = ec.register_resource("linux::Application")
cmd = 'ping -c5 -I {} {}'.format(wifi_interface, wifi_ip_fit01)
ec.set(app_ping_from_fit02_to_fit01, "command", cmd)
ec.register_connection(app_ping_from_fit02_to_fit01, fit02)
ec.deploy(app_ping_from_fit02_to_fit01)
ec.wait_finished(app_ping_from_fit02_to_fit01)

# recovering the results of fit01
print ("\n--- INFO: output fit01:")
print (ec.trace(app_ping_from_fit01_to_fit02, "stdout"))

# recovering the results fit02
print ("\n--- INFO: output fit02:")
print (ec.trace(app_ping_from_fit02_to_fit01, "stdout"))

# shutting down the experiment
ec.shutdown()
