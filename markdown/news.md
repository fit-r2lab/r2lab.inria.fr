title: Latest news & infos...
tab: news
skip_news: yes
---

# Most recent first&nbsp;: (see also our [list of papers](papers.md))

****
## 2024
****

### July

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): demo updated to possibly use flexric (NearRealtime-RIC) and the E2 interface.

### April

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): demo updated to handle `cu/du` and `cu-cp/cu-up/du` split modes.

### March

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): demo updated to handle different DNNs and several running modes(`full, gnb-only, gnb-upf`).

### February

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): demo updated to add a [github runner script](https://github.com/sopnode/oai5g-rru/blob/develop-r2lab/.github/workflows/github-actions-demo.yml) to automate and benchmark an OAI5G scenario with jaguar RRU and 5G quectel UE on R2lab/SophiaNode.

### January 

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): demo updated to handle the [oai-5g-advance mode](https://gitlab.eurecom.fr/oai/cn5g/oai-cn5g-fed/-/tree/develop/charts/oai-5g-core/oai-5g-advance?ref_type=heads).

****
## 2023
****

### November

* [oai5g-rru](https://github.com/sopnode/oai5g-rru): New demo available demonstrating how to automate an OAI5G deployment on a kubernetes (k8s) cluster with real 5G devices (e.g., jaguar/panther/n300/n320/b210 RRUs and 5G phones/Quectel UEs). The cluster is composed of server(s) running on the SophiaNode and a few R2lab nodes attached as workers in the k8s cluster. The script uses specific OAI5G k8s charts adapted to the R2lab/SophiaNaode environment ([oai-cn5g-fed, develop-r2lab branch](https://gitlab.eurecom.fr/oai/cn5g/oai-cn5g-fed/-/tree/develop-r2lab?ref_type=heads)).
* [r2lab-k8s](https://github.com/sopnode/r2lab-k8s): New demo available demonstrating how to demonstrate how to use R2lab nodes as workers in a SophiaNode k8s cluster.

### October

* [oai5g-mep](https://github.com/sopnode/oai5g-mep): New demo available demonstrating how to deploy the [OpenAirInterface Multi-access Edge Computing Platform blueprint](https://gitlab.eurecom.fr/oai/orchestration/blueprints/-/blob/master/mep/README.md) within the Sopnode/R2lab platform.

### June

* Three qhat nodes (Raspberry Pi4 with 5G Quectel RM 500Q-GL) have been added in R2lab, see [Nodes section](https://r2lab.inria.fr/hardware.md) for further details.

### May

* The two old phones, `phone1` and `phone2` have been replaced by two new 5G phones: HUAWEI P40 Pro and Google Pixel 7, respectively.

### January

* The `rhubarbe` git repo gets transferred under the `fit-r2lab` umbrella, at <https://github.com/fit-r2lab/rhubarbe>

****
## 2022
****

### November

* running on fedora 37
* image available for ubuntu-22


### September

* [oai5g-rfsim](https://github.com/sopnode/oai5g-rfsim): New demo available that aims to demonstrate how to automate an OAI5G deployment on the SophiaNode cluster using both FIT nodes on R2lab and classical k8s workers.

### June

* Two AW2S 5G RRUs Jaguar and Panther have been added in R2lab, see [Nodes section](https://r2lab.inria.fr/hardware.md) for further details.

### March

* macphone2, that used to be a Motorola Moto 2nd Gen, is replaced by a Nexus 5
* the whole testbed infrastructure now runs on Fedora 35 + MacOS monterey

### February

* Six 4G/5G quectel nodes (Quectel RM 500Q-GL modules connected via USB3 to fit nodes) have been added to R2lab, see [Nodes section](https://r2lab.inria.fr/hardware.md) for further details.

****
## 2021
****

### April
Thanks to Raphael Defosseux <<raphael.defosseux@openairinterface.org>>, we are delighted to announce that the lastest version of OpenAirInterface (OAI) EPC and RAN are available (and will be periodically refreshed) with docker images specific to the R2lab testbed. To automatically deploy those images, checkout the r2lab-demo code through `git clone https://github.com/fit-r2lab/r2lab-demos.git` and follow the steps described in the `oaici-docker/README-OAICI.md` [tuto](https://r2lab.inria.fr/README-OAICI.md). 

****
## 2019
****

### November

* deployed 2 boxes based on B-205 USRP hardware with duplexers (one for UE and one for eNB)
* new images for `centos-8` and `fedora-31` are available;  
  run `rhubarbe images centos-8 fedora-31` for their status

### October

* part of the OpenAirInterface's CI run on a nightly basis on R2lab

### March

* the federation link with Fed4Fire, that had been down for a couple years 
  due to some nasty MD5-signed certificates, is live again. 
  Fed4Fire users can make reservations throught Jfed again.

****
## 2018
****

### December

* `faraday.inria.fr`, `r2lab.inria.fr` and `r2labapi.inria.fr` all run fedora29

### April

* R2lab participates in the [1st joint Grid5000-FIT
  school](http://www.silecs.net/1st-grid5000-fit-school/), triggered as the
  first public milestone of the SILECS project.

* people interested in following the hands-on session on R2lab [should start here](/school.md).

### March

* a second commercial phone - type Moto E - is available in the chamber

### February

The code for the testbed has been split into the following git repos:

* user-oriented

  * all embedded code as [r2lab-embedded](https://github.com/fit-r2lab/r2lab-embedded)
  * various demos and other running code as [r2lab-demos](https://github.com/fit-r2lab/r2lab-demos)
  * the python library as [r2lab-python](https://github.com/fit-r2lab/r2lab-python) (and on [[readthedocs]](http://r2lab.readthedocs.io))

* website-related

  * the website as [r2lab.inria.fr](https://github.com/fit-r2lab/r2lab.inria.fr)
  * website auxiliary files as [r2lab.inria.fr-raw](https://github.com/fit-r2lab/r2lab.inria.fr-raw)
  * the websockets companion server as [r2lab-sidecar](https://github.com/fit-r2lab/r2lab-sidecar)

* backend

  * a collection of internal utilities as [r2lab-misc](https://github.com/fit-r2lab/r2lab-misc)

As a reminder, the code for `nepi-ng` currently sits here:

* `nepi-ng` : [[umbrella website]](https://nepi-ng.inria.fr)
* `asynciojobs`: [[git]](https://github.com/parmentelat/asynciojobs) [[readthedocs]](http://asynciojobs.readthedocs.io/)
* `apssh`: [[git]](https://github.com/parmentelat/apssh) [[readthedocs]](https://apssh.readthedocs.io/)


### January 2018

* the `demos/` subtree in the `r2lab` github repo was split and moved into [a separated repo named r2lab-demos](https://github.com/fit-r2lab/r2lab-demos)
* a mybinder shell has been setup to host notebooks in one-click, like e.g.
  <a href="https://mybinder.org/v2/gh/fit-r2lab/r2lab-demos/master?filepath=radiomap%2Fradiomap.ipynb" target='_'>
  our radiomap application <img src="https://mybinder.org/badge.svg">
  </a>


****
## 2017
****


### November

* some nodes feature a LimeSDR device
* so-called *nightly* procedure, that probes the testbed for failures, is reinstated to run on a bi-weekly basis

### September

* some nodes now feature a USB-based LTE dongle

### August

* [the openair demo](https://github.com/fit-r2lab/r2lab-demos/tree/master/openair) is given during the SIGCOMM-2017 demo session

### July

* the Dell physical server that hosts the r2lab service VMs is upgraded and now runs a HTML5-based DRAC interface, causing a 2-hours scheduled outage of the testbed

### April

* [the radiomap demo](https://github.com/fit-r2lab/r2lab-demos/tree/master/radiomap) gathers all-pairs communication conditions, see `visumap`  on how this can be visualized in a jupyter notebook


****
## 2016
****

<h3 id='migration'>December 20</h3>

* Running new architecture based on **PLCAPI** instead of **omf_sfa**
* Previous contents (accounts, slices, keys...) has been migrated automatically
* Slice names have changed a little, to be completed

### November 30

* All tutorials now point at `nepi-ng` instead of deprecated `nepi`

### November 9

* [Inauguration ceremony - see detailed program here.](https://www.inria.fr/en/centre/sophia/calendar/r2lab-anechoic-chamber-a-heterogeneous-wireless-testbed)

* Slides available below:

  * [Keynote by Max Ott](/raw/slides/2016-11-opening-keynote-max-ott.pdf)
  * [FIT Equipex, by Éric FLeury](/raw/slides/2016-11-opening-fit-eric-fleury.pdf)
  * [FIT/CortexLab, by Tanguy Risset](/raw/slides/2016-11-opening-cortexlab-tanguy-risset.pdf)
  * [FIT/R2lab, by Walid Dabbous](/raw/slides/2016-11-opening-r2lab-walid-dabbous.pdf)
  * [OpenAirInterface, by Raymond Knopp](/raw/slides/2016-11-opening-openairinterface-raymond-knopp.pdf)
  * [Demo on R2lab: setting up a 4G network in 3mn, by Thierry Parmentelat](/raw/slides/2016-11-opening-r2lab-demo-thierry-parmentelat.pdf)


### November 4

* R2lab is [mentioned and described in this article in the WebTimeMedias newspaper (in French)](http://www.webtimemedias.com/article/sophia-inaugure-ses-deux-chambres-sourdes-laboratoires-de-la-5g-20161104-58944)

### October 24

* OpenAirInterface images for deploying infrastructures and eNodeB's are available under the names
  * `u14.319-oai-enb` for eNodeB's and scramblers and such
  * `u14.48-oai-gw` for infrastructure services like Home Subscriber Server (HSS) and Evolved Packet Core (EPC)

### October 15

* We have now 6 nodes equipped with USRP's

### October 1

* We now use [an automated tool](https://github.com/fit-r2lab/r2lab/blob/master/infra/builds/build-image.py) for building images [on a nightly basis](https://github.com/fit-r2lab/r2lab/blob/master/infra/builds/all-images.sh)

### September 15

* We have been working on a replacement for NEPI
* We have published 2 python libraries on pypi
  * [`asynciojobs`](https://github.com/parmentelat/asynciojobs)
  * [`apssh`](https://github.com/parmentelat/apssh), see also [this link](https://github.com/parmentelat/apssh/blob/master/README-jobs.md)
* We have [our first workable script](https://github.com/fit-r2lab/r2lab-demos/blob/master/orion/angle-measure.py) that uses this combination of tools for running an experiment on R2lab
* This new paradigm runs several times faster than the initial NEPI-based version.

### September 2

* upgrade of the physical server `faraday.inria.fr` to ubuntu-16.04-LTS
* upgrade of its web companion VM `r2lab.inria.fr` to fedora-24

* this means both hosts can take `systemd` and `python3.5` for granted
* in the mix, `omf_sfa` on `faraday` now runs on top of `ruby 2.3.1p112`

### August 30

* The R2lab team pays a visit to [our colleagues of FIT/CorteXlab at INSA Lyon](http://www.cortexlab.fr/)

### July 25

* Both faulty nodes 4 and 18 are shipped back to Greece for troubleshooting by the manufacturer

### July 13

* Node 18 is set aside and replaced with a spare node (no impact for users)
* All nodes deemed sustainably operational
* Nightly routine now is from 3a.m. until 4a.m.

### June 17

* New tutorial video! Setting up an OpenAirInterface-based 5G infrastructure,
  and a tour in the chamber using Skype on a commercial NEXUS phone.
* Check it out, [here](https://youtu.be/FpZo6uqTosQ)

### June 6

* Replacement of battery on nodes 7, 14, 18, 29 and 30 to deal with hang issues when restarting.

### March 17

* The 3d printed boxes are ready to ship

### Feb 28

* Start progressive rollout of a new layout for antennas
* Antennas to be aligned in a row, on a north-south line (relative to the livemap, not geographically)
* And spaces on a 3cm basis (although this seems a little too wide)

### Feb 25

* Start Progressive deployment of Intel 5300 cards.
  * Target is one Atheros and one Intel on each node

### Feb 20
* Ordered 3d-printed boxes to contain cards as they cannot be seated inside the box

### Feb 2 2016

* Reception of USRP-oriented extensions of the CMC cards
* Related firmware version is 3.2.
* Deployed on only a couple nodes for now

****
## 2015
****

### December 20

* Announcement of global availability; the testbed is now open to public use.

### November 30

* Deployment of [rhubarbe](https://github.com/parmentelat/rhubarbe) as a replacement of `omf6` for managing node images. New features include
  * written in [python 3 / asyncio](https://docs.python.org/3/library/asyncio.html) which results in a single threaded asynchroneous application
  * which makes it much more efficient than its ruby ancestor (can load all 37 nodes in parallel without a glitch)
  * and more reliable too (**always** exits if timeout expires for any reason)
  * includes a tool to wait for all nodes to be responsive (`rhubarbe wait`)
  * and to inspect current reservations (`rhubarbe leases`)
  * as well as a monitoring tool (this is what feeds the [livemap](status.md#livemap) and [livetable](status.md#livetable) views

* As a result, it is now possible for us to expose a single resource named `37nodes` to the onelab portal, thus materializing the fact that the whole testbed is actually reserved

### November 10

* availability of images based on fedora-23 and ubuntu-15.10

### November 9

* reverting `nitos_testbed_rc` to run gem 2.0.3 again (with our patches for
  using latest frisbee) ; 2.0.4 is not working properly for us, loading
  images is even less reliable than 2.0.3.

### November 6

* Announce availability to all FIT partners

### November 6

* Software upgrade
  * `omf_sfa`  now runs git hash `fd21d587` of Sept. 8 - prior to that, R2Lab was using
  `752868919` of Jul. 24
  * `nitos_testbed_rc` now runs gem 2.0.4

### September 22

* LabEx / Com4Innov meeting

### September 15
* R2lab Platform Live Map : we are working to finish a live map information of the R2Lab platform.

### September 5
* R2lab Platform Status : from today is possible follow the tech details of R2lab platform.

* We are monitoring some information from the nodes in the anechoic chamber.
Have a look at [our status page](status.md#livemap) for details.

### July 9
* FIT Meeting in Paris.
