title: Overview
tab: overview
widget_login_template: r2lab/widget_login.html
---

<div class="container" markdown="1">

### What is R2Lab ?

<div class="row" markdown="1">
<div class="col-md-7" markdown="1">
Located at Inria Sophia-Antipolis, R2lab is an open wireless experimentation platform designed for reproducible research on WiFi, Bluetooth, LoRa, and cellular (4G/5G+) networks.

The testbed is installed inside a shielded enclosure (Faraday cage) that provides complete electromagnetic isolation from the outside environment. The walls are lined with radio-frequency absorbing materials that minimize electromagnetic reflections. Without these absorbers, the enclosure would behave like a microwave cavity, where multiple reflections would create an unrealistic and highly variable propagation environment.

Although R2lab is often referred to as being located in an anechoic chamber, this is not strictly accurate. The room contains numerous metallic objects—such as PCs, antennas, cable trays, and metal enclosures—mounted near the ceiling. These elements introduce controlled reflections that make the propagation environment more representative of a realistic indoor deployment, while the room remains fully isolated from external radio interference.

The primary objective of R2lab is therefore not to create a perfectly reflection-free environment, but to provide a stable, repeatable, and well-controlled wireless environment where experiments can be reproduced under identical conditions. In addition, controlled interference can be deliberately introduced, for example using RF noise generators or other signal sources, enabling systematic evaluation of wireless protocols and algorithms under reproducible interference conditions.
</div>

<div class="col-md-5" markdown="1">
<img src="/assets/img/overview-room.png" class="fit-width">
</div>
</div> <!-- row -->

<hr>

<h2 class="text-center" style="color:green;">
<br/>
<a href="/tour.md" style="color:green; text-decoration: none;">
Check out our platform in a virtual tour<br/>

<span class="text-muted lead">for a quick and easy visit of R2lab</span><br></a>
</h2>

<hr>

### Offering in terms of hardware

<div class="row" markdown="1">

<div class="col-md-3" markdown="1">
<br>
<img src="/assets/img/overview-node.png" class="fit-width">
</div>

<div class="col-md-1" markdown="1">
</div>
<div class="col-md-8" markdown="1">

The R2lab platform is hosted inside a shielded RF enclosure of ≈ 90 m<sup>2</sup>.
It hosts thirty-seven ceiling-mounted FIT nodes arranged on a fixed grid and includes:

* 15 software-defined radios (SDRs): Ettus Research USRP devices (N320, N300, X310, N210, B210, B205mini, USRP1, and USRP2), as well as one LimeSDR.

* 15 user equipments (UEs): thirteen Quectel-based FR1 UEs, two Quectel-based FR2 UEs, and two commercial 5G smartphones (Google Pixel 7 and Huawei P40).

* 6 5G radio units (RUs): two AW2S RUs (Jaguar and Panther), two Benetel RAN550 RUs, one Liteon FR2 RU, and one Spear Andrew 32T32R Sub-6 GHz Massive MIMO RU.

All these resources can be controlled remotely through a single SSH gateway at
`faraday.inria.fr`. Users have full control and can run their OS of choice
with any experimental software they need to achieve their goals.

Experiments can be orchestrated using standard tools. For convenience, we also provide a set of Python libraries ([see the documentation and tutorials](tools.md)) that simplify experiment automation. These libraries allow users to reserve the entire testbed, remotely control wireless devices, and efficiently script the complete experimental workflow, from node provisioning and configuration to experiment execution and data collection.

Check out our YouTube videos for more information.
</div>

</div> <!-- row -->

<hr>

### A federated testbed

<div class="row" markdown="1">
<div class="col-md-8" markdown="1">

R2lab has been built in the context of the [FIT Equipex Project, funded by ANR](https://www.fit-equipex.fr/), which offers a range of testbeds oriented towards research in wireless networking.
As such, it is part of the [OneLab federation of testbeds](http://onelab.eu), a consortium of higher education and research institutions. This ecosystem features a variety of networking and communication environments and testbeds that offer a wide spectrum of services: internet-overlaid testbeds; wireless, sensing and mobility testbeds; broadband access; core testbeds and network emulation environments.

To support Post-5G experimentation, we have expanded R2lab with programmable networking, cloud resources, and high-performance real-time processing at scale. This evolution, called the SophiaNode, is a site of [SLICES-RI](https://www.slices-ri.eu/) (Scientific Large-scale Infrastructure for Computing/Communication Experimental Studies), developed jointly with Eurecom, and it integrates R2lab into the SLICES-RI ecosystem. To keep earlier R2lab experiments reproducible, the existing equipment remains accessible through the R2lab workflows and is also compatible with the SLICES-RI workflow. New equipment, in contrast, is used exclusively within the SLICES-RI workflow. In short, the R2lab evolution is backward compatible.

The SophiaNode comprises three wireless facilities: the R2lab anechoic chamber at Inria, augmented with 5G hardware; an indoor site at Eurecom; and an outdoor site on the SophiaTech campus. High-speed fiber links (600 Gbps at the time of writing) connect these facilities to a data center at Inria, which hosts compute resources (1500+ cores, 3+ TB RAM), storage (250+ TiB planned), and hardware accelerators such as GPUs and SmartNICs.
</div>

<div class="col-md-1" markdown="1">
</div>

<div class="col-md-3" markdown="1">
<br>
<object type="image/svg+xml" data="/assets/img/fit-logo.svg" height="55">FIT</object>
<br>
<img src="/assets/img/onelab-logo.png" style="height:55px;">
<br>
</div>

</div> <!-- row -->

</div> <!-- container -->
-md-1" markdown="1">
</div>

<div class="col-md-3" markdown="1">
<br>

<object type="image/svg+xml"
        data="/assets/img/fit-logo.svg"
        height="55">
    FIT
</object>
<br>

<img src="/assets/img/onelab-logo.png"
     alt="OneLab"
     style="height:55px;">
<br>

<img src="/assets/img/slices-ri.png"
     alt="SLICES-RI"
     style="height:55px;">
<br>

</div>

</div> <!-- row -->

</div> <!-- container -->

