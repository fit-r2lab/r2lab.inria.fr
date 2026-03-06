title: Video Tutorials on YouTube
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>

<div class="container" markdown="1">

<< tuto_tabs "Angle of Arrival":AOA "OAI (early)":OAI "5G in 5'":OAING "5G in 8' on k8s":OAIK8S "OLSR vs batman":OLSRBATMAN >>

<div id="contents" class="tab-content" markdown="1">

<!-- ------- AOA ------------>
<div id="AOA" class="tab-pane fade show active" markdown="1">


### Measuring WiFi angle of arrival

In this video, we give an end-to-end overview of how to conduct a realistic experiment. In this case, the scientific objectives are to compare the results of several methods for estimating the angle of arrival of a WiFi signal, on a receiver that has 3 aligned antennas, distant from one another by about half the wavelength.

This video emphasizes the usage of NEPI as a tool for designing the experiment logic. Check it out here&nbsp;:

<object width="854" height="480"
data="https://www.youtube.com/embed/vDPLQNsZaVY">
</object>

</div>

<!-- ------- OAI ------------>
<div id="OAI" class="tab-pane fade" markdown="1">

### Visiting the chamber using skype on top of a local 5G infrastructure based on OpenAirInterface

In this video, we illustrate how to leverage OpenAirInterface in order to

* create a standalone 5G infrastructure inside R2Lab,
* and deploy a base station on one of the nodes.

Based on this, we establish a skype session between a regular laptop and a commercial Nexus phone, right inside the chamber, and take this chance to give a physical tour of the chamber.

Later on, we use yet another node as a scrambling device to terminate the call.

<object width="854" height="480"
data="https://www.youtube.com/embed/FpZo6uqTosQ">
</object>

</div>

<!-- ------- OAING ------------>
<div id="OAING" class="tab-pane fade" markdown="1">

### Set up a 5G network in 5 minutes

The purpose is very similar to the previous one; here again we leverage OpenAirInterface in order to

* create a standalone 5G infrastructure inside R2Lab,
* deploy a base station on one of the nodes,
* connect the dedicated phone inside the chamber,
* measure bandwidth to the outside Internet with speedtest.net,
* and visualize downlink and uplink spectrum.

<object width="854" height="480"
data="https://www.youtube.com/embed/N1nl_PqWlKw">
</object>

</div>


<!-- ------- OAIK8S ------------>
<div id="OAIK8S" class="tab-pane fade" markdown="1">

### Set up a 5G network in 8 minutes over kubernetes

Same old again, but over a kubernets cluster deployed over a few worker nodes in R2lab

<object width="854" height="480"
data="https://www.youtube.com/embed/b_oB9z7jflg">
</object>

</div>

<!-- ------- OLSRBATMAN ------------>
<div id="OLSRBATMAN" class="tab-pane fade" markdown="1">

### Comparing OLSR and batman

In this video we show how to use [this demo published on
github](https://github.com/fit-r2lab/r2lab-demos/tree/master/batman-vs-olsr),
that uses nepi-ng and a Jupyter notebook to perform an objective
comparison between two MANET routing protocols, namely OLSR and
batman.


<object width="854" height="480"
data="https://www.youtube.com/embed/p2FfpkMLN_k">
</object>

</div>

</div> <!-- end div contents -->

</div> <!-- end div container -->
