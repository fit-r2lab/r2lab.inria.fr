title: R2lab FAQ
tab: tutorial
skip_header: True

<div class="container" markdown="1">

<< tuto_tabs "FAQ": >>

<div id="contents" class="tab-content" markdown="1">

<!-- ------- INTRO ------------>
<div id="FAQ" class="tab-pane fade show active" markdown="1">

In no particular order...

[TOC]

****

### How should I cite R2lab in my paper?

If you are using R2lab for in your publications, please add the following text in the Acknowledgment section of your papers/reports:

*We would like to thank the FIT R2lab team from Inria, Sophia Antipolis, for their help in using the FIT-R2lab testbed (\url{https://fit-r2lab.inria.fr/}) [Ref-R2lab].*

[Ref-R2lab]: T. Parmentelat, M.N. Mahfoudi, T. Turletti, and W. Dabbous, W. (2019). ``A step towards runnable papers using R2lab", INRIA Research Report, June 2019.

****

### `nepi-ng` or `apssh` won't find my ssh key

The simplest answer is, make sure to add the relevant ssh key in your ssh agent.

See also [this other tutorial page again](http://localhost:8000/tuto-030-nepi-ng-install.md#SSHAGENT)

****

### How can I send noise on a WiFi or 5G frequency

It is easy to do that from any node that has a USRP attached.

You will need `gnuradio`'s `uhd_siggen` utility; this is among others shiped in
our `gnuradio` image - see the manual page for details.

****

### How do I use the `data` wired interface

The standard images do turn on the `control` wired interface at boot-time (of course, otherwise we could not reach them), but OTOH they **do not** manage the `data` interface at all.

You can use the convenience function

    turn-on-data

that will use DHCP to configure your data interface; it will in this case be reachable from the gateway or from other nodes as hostname e.g. `data27`.

**Important note**

The nodes that have a USRP attached of type `n210` or `usrp2` **cannot use the `data` interface** (see below).

****

### How do I initialize a USRP device connected through Ethernet

We have just seen that nodes that have a USRP attached of type `n210` or `usrp2` **cannot use the `data` interface** as the physical interface is actually used to connect to the USRP device instead.

On these nodes you need to initialize the connexion between node and USRP using this convenience function:

    enable-usrp-ethernet

****

### How do I initialize a USRP device connected through USB

##### From the node itself

    usrp-reset

##### From faraday

You can use the usual rhubarbe selection mechanism, like .e.g

    rhubarbe usrpoff 1-5,10
    rhubarbe usrpoff 1-5,10


Or shorter

    uoff 1-11-2
    uon 1-11-2

</div>

</div> <!-- contents -->

</div> <!-- container -->
