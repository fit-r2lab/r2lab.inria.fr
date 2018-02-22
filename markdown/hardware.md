title: Hardware
tab: platform
---
<div class="container">
  <div class="row">
    <div class="col-md-12">
      <p>
        <b>Thirty-seven</b> nodes are available in R2lab to provide a modern testbed infra structure.
        The nodes are distributed in a grid layout and are customizable, allowing great variety of experimentation scenarios.
        <h2 class="text-center" style="color:green;">
          Full control and access to bare metal
          <br>
          <span class="text-muted lead">
            The nodes are totally open and users can install any software stack they need
          </span>
          <br>
        </h2>
      </p>
    </div>
  </div>
</div>

</hr>

<div class="container" markdown="1">
  <div class="row">
    <div class="col-md-4">
      <span> <h3>The testbed is yours</h3> </span>
      <p>
	The testbed is reservable as a whole.
	Once they have booked the testbed, registered users can ssh into `faraday.inria.fr`,
	and from there control all the resources in the testbed.
	You are thus in full control of all the radio traffic in the chamber. 
        </p>
    </div>
    <div class="col-md-4">
      <span> <h3>The nodes are yours</h3> </span>
      <p>
        Also you can load your operating system of choice on any node.
	From that point you can ssh-access all nodes with administration privileges, and configure
	the available resources - nodes, SDRs and phones - to create a rich experimental environment.
       </p>
    </div>
    <div class="col-md-4">
      <span> <h3>Methodology</h3> </span>
      <p>
      Experimental scenarios can be created using standard tools. We also provide [tutorials, and python libraries](tutorial.md)
      that can optionnally help you efficiently orchestrate the complete experimental workflow, from deployment to data collection.
      </p>
    </div>
  </div>
</div>

<br/>

<div class="container" markdown="1">
  <div class="row">
    <div class="col-md-8 new_pad">
### All nodes

All 37 nodes are based on <a href="http://nitlab.inf.uth.gr/NITlab/" target="_blank">Nitos X50</a> and feature

* State of the art motherboard
  * CPU Intel Core i7-2600 processor
  * 8Gb RAM
  * 240 Gb SSD
* 2 Wireless Interfaces, dedicated to experimentation, 3 antennas each&nbsp;:
  * one Atheros 802.11 93xx a/b/g/n
  * and one Intel 5300
* 3 wired interfaces used for&nbsp;:
  * remote power and reset management,
  * `control`, used by the testbed management framework for providing access - 192.168.3.`nn`, where `nn` is the node number
  * `data`, dedicated to experimentation - 192.168.2.`nn`.

    </div>
    <div class="col-md-4">
      <br/>
      <img src="/assets/img/hardware-node.png" class='fit-width'>
      <center>Icarus Nodes in the testbed</center>
    </div>
  </div>
</div>

<div class="container" markdown="1">
 <div class="row">
  <div class="col-md-4">
    <br/>
  <img src="/assets/img/hardware-icarus.png"  class='fit-width'>
  <center>Icarus node standalone</center>
  </div>
  <div class="col-md-8 new_pad">

### USRP nodes

Some nodes are equipped with USRP devices from <a href="http://www.ettus.com" target="_blank">ETTUS</a> to run SDR-based experiments such as spectrum analyzer or 4G/5G OpenAirInterface scenarios. All these devices can be remotely-controlled through the `ust`/`uon`/`uoff` utilities. 

Currently, our deployment features the following types of USRP devices :
  <a href="http://www.ettus.com/product/details/UB210-KIT" target="_blank">USRP B210</a>,
  <a href="http://www.ettus.com/product/details/UN210-KIT" target="_blank">USRP N210</a>, 
  <a href="http://files.ettus.com/manual/page_usrp2.html" target="_blank">USRP 2</a>, and
  <a href="https://www.ettus.com/product/details/USRPPKG" target="_blank">USRP 1</a> (see detailed mapping in the table below).

Make sure [to read the additional notes below](#gory-details) that cover some specifics of these devices.

  </div>
 </div>
</div>

<div class="container" markdown="1">
  <div class="row">
    <div class="col-md-8 new_pad">
###Lime SDR devices

Here are the detailed specifications for the LimeSDR devices deployed in the chamber (see table below for the details on which nodes host such devices)

*    **RF Transceiver**: Lime Microsystems LMS7002M MIMO FPRF (Datasheet)
*    **FPGA**: Altera Cyclone IV EP4CE40F23 - also compatible with EP4CE30F23
*    **Memory**: 256 MBytes DDR2 SDRAM
*    **Oscillator**: Rakon RPT7050A @30.72MHz (Datasheet)
*    **Continuous frequency range**: 100 kHz – 3.8 GHz
*    **Bandwidth**: 61.44 MHz
*    **RF connection**: 10 U.FL connectors (6 RX, 4 TX)
*    **Power Output (CW)**: up to 10 dBm
*    **Multiplexing**: 2x2 MIMO
*    **Dimensions**: 100 mm x 60 mm
*    **Plus**: "What makes LimeSDR interesting is that it is using Snappy Ubuntu Core as a sort of app store. Developers can make code available, and end-users can easily download and install that code."

    </div>
   <div class="col-md-4">
    <br/>
    <img src="/assets/img/lime-sdr.png"  class='fit-width'>
    <center>Node with a Lime SDR device</center>
   </div>
  </div>
</div>


<div class="container" markdown="1">
  <div class="row">
    <div class="col-md-4">
      <br><br>
      <img src="/assets/img/macphone.png"  class='fit-width'>
      <center>How to control a commercial phone</center>
    </div>
    <div class="col-md-8 new_pad">
###Commercial 4G Phone

A Nexus 5 phone is available right inside the chamber:

* It is reachable through a Mac (that also sits in the room) that has
  its wireless card physically disabled, and that has a USB cable to
  the phone
* The Mac can be reached from the gateway as `ssh tester@macphone` (or
  the <code>macphone</code> convenience shell shortcut)
* Once logged in the Mac you can use convenience helpers to manage the
  phone (type <code>help</code> for details), or use <code>adb</code>
  manually.
* The mac can also be managed using apple screen sharing tools
  (VNC-compliant), pointing directly at <code>faraday.inria.fr</code>
* You will find more details about controlling the phone [in the
  tutorials section](/tuto-800-5g.md#PHONE).

</div>
  </div>
</div>


<div class="container" markdown="1">
  <div class="row">
    <div class="col-md-4 new_pad">
###Important notes on SDR devices
<a name='gory-details'></a>
Please note the following specifics about the additional SDR devices:

* the following table shows in the **usrp** columns the type of the
  attached SDR, if present

* the `n210` and `usrp2` models use an **Ethernet** connection to link
  to the node. This means that on those nodes, the `data` wired
  interface is **not available**, as the hardware interface is wired
  into the USRP device.

    </div>
 
    <div class="col-md-8">

### Duplexers

Some USRP devices, like the `b210`, have their Tx and Rx SMA
connectors very close to one another. For that reason some have
a device named a **duplexer band 7**<a
href="/raw/docs/duplexer-band7-specifications.pdf"
target="_blank">[specs]</a> <a href="/raw/docs/duplexer-band7.png"
target="_blank">[pict]</a>.

The settings used in our deployed duplexers match the frequencies used
in our default configuration for OpenAirInterface. That is to say, it is assumed that

* Downlink (eNB to UE) uses frequency 2.66 GHz (duplexers are set to the 2.62-2.69 GHz range)
* Uplink (UE to eNB) uses frequency 2.54 GHz (duplexers are set to the 2.50-2.57 GHz range)

In the **duplexer** column below, devices are
tagged as either `none`, `for UE` or `for eNB`.

With the above assumptions, these tags can be interpreted as follows:

* `none`: no duplexer is attached

* `for UE`: to transmits on the uplink and receive on the downlink;  
  hence typically this setup can be used to scramble the uplink

* `for eNB`: conversely, this node is fit to scramble the downlink

   </div>
  </div>
</div>


<div class="container">
  <div class="row" markdown="1">
    <div class="col-md-12 new_pad">
      <h3>Nodes detailed information</h3>
      <p>Clicking in the header will focus on nodes that have a USRP device</p>
      <table class="table table-condensed" id='livehardware_container'> </table>
      <script type="text/javascript" src="/assets/r2lab/livecolumns.js"></script>
      <script type="text/javascript" src="/assets/r2lab/livehardware.js"></script>
      <style type="text/css"> @import url("/assets/r2lab/livecolumns.css"); </style>
      <style type="text/css"> @import url("/assets/r2lab/livehardware.css"); </style>
    </div>
  </div>
</div>

<div class="modal fade" id="big_photo" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-custom modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
	      </button>
      <h6 class="modal-title" id="big_image_title">&nbsp;</h6>
      </div>
      <div class="modal-body" id="big_image_content">
      </div>
    </div>
  </div>
</div>

<div class="container">
  <div class="row" markdown="1">
    <div class="col-md-8 new_pad">
      <h3>Statistics on nodes health</h3>
      The testbed routinely runs a thorough raincheck procedure, to make sure that all is in order.
      <br>
      <a href="/stats.md">See the stats page for details</a>.
    </div>
  </div>
</div>


<script type="text/javascript" src="/assets/r2lab/xhttp-django.js"></script>
<!-- defines nodes_details_modal -->
<< include r2lab/nodes-details-modal.html >>
