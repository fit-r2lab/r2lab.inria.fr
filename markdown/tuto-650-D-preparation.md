title: nepi-ng - D - testbed preping
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>

<ul class="nav nav-tabs">
  <li class="active"> <a href="#INTRO">INTRO</a> </li>
  <li> <a href="#D1">D1</a></li>
  <li> <a href="#D2">D2</a></li>
  <li> <a href="#D3">D3</a></li>
  <li> <a href="#D4">D4</a></li>
  <li> <a href="#D5">D5</a></li>
  <li> <a href="#WRAPUP">WRAPUP</a></li>

  << include r2lab/tutos-index.html >>
</ul>


<div id="contents" class="tab-content" markdown="1">

<!------------ INTRO ------------>
<div id="INTRO" class="tab-pane fade in active">

### Preparation

At this point, you should have a clear understanding of how to design your
experiment using `nepi-ng`. In this tutorial section, we  come back to the
initialization and preparation stages, that we had done manually at first  -
i.e. using [the shell tools](tuto-200-shell-tools.md) - and show how to account
for these various preparation tasks in a `nepi-ng` script.

So, we start back from the last code in the A section - namely
`A5-ping.py`, remember:

<center> <img src="/assets/img/A5.png" alt="d1" height="240px"></center>

We will improve this script so that it takes care of initializations,
and specifically we will add a command line option that, when enabled:

* makes sure that all the nodes that we do not use are actually turned off,
* and loads the `ubuntu` image on the nodes that we do use.

It is a rather common need for all experiments to take these aspects into
account. We do recommend to make image loading an option though, since
performing this for every run vey quickly gets in the way when fine-tuning your
experiment.

Please note that the script **will not** try to **get a lease**
automatically, instead we keep the simple policy of **just checking** that
we have a valid lease.

Like always, we will improve the code by small incremental changes.

### Important note on shell tools

**Most of the convenience tools are just aliases**

Before we dive in this area, we need to stress an important point.
In the tutorial on [the shell tools](tuto-200-shell-tools.md),
we had seen sessions like this:

    rleases
    all-off
    n 1-5 33,37 ~3
    rload -i fedora


It is important to emphasize that the commands involved here are all
**volatile bash** materials like *aliases* or *functions*.  
This means that, as of beginning of Feb. 2018 at least,
if you try to run from your laptop something like this:

    $ ssh inria_r2lab.tutorial@faraday.inria.fr rleases
    bash: rleases: command not found

you get an error, that is to be compared this with:

    $ ssh inria_r2lab.tutorial@faraday.inria.fr rhubarbe leases
    ----- <Leases from PLCAPIproxy@https://r2labapi.inria.fr:443/PLCAPI/ - 25 lease(s)>
      1  < from 02-22 @ 08:00 until 09:00 CET inria_oai
    ...

The rationale being that there is a need for *very short* commands in an
*interactive* shell environment. But when invoking commands remotely
through ssh, you don't run `bash` and so the bash-written convenience
layer does not come into play.

The same goes of course for convenience tools exposed from the nodes environment.

xxx termshots of multihop ssh sessions - something along this line:
ssh inria_r2lab.tutorial@faraday.inria.fr ssh root@fit01 usrpon
xxx

#### How to figure long commands

For starters, as a rule of thumb, all convenience commands that are derived from
`rhubarbe` are made up the same way. Just like `rleases` is an alias for
`rhubarbe leases`,  you will find that `rbye` is an alias for `rhubarbe bye`.

xxx add a few termshots

Second, it is very easy to find out about a given command when logged on
faraday, using `bash`'s built-in `type` command

xxx add a few termshots

#### How to use short commands in scripts

Finally, note that you can expose short commands in your scripts by adding
a line Like this:

```
source /etc/profile.d/faraday.sh
```

or, for code meant to run on nodes

```
source /etc/profile.d/nodes.sh
```

xxx do we have real examples in some example on github ?

xxx

All this being said, let us now see [in the next tab D1](javascript:open_tab('D1')) how to extend the A5 script and turn it into D1 that knows how to load images.

</div>


<!------------ D1 ------------>
<div id="D1" class="tab-pane fade" markdown="1">

xxx

### Objective

Our first experiment code is designed to run on YOUR computer. From
there we trigger a simple command on the R2lab gateway, that is to say
`faraday.inria.fr`; namely we will simply ping the google server
`google.fr` from `faraday`, as depicted below.

<center> <img src="/assets/img/D1.png" alt="a1" height="240px"></center>

### Introduction to `nepi-ng`

This example introduces the following classes:

* `SshNode` is a class that represents an ssh connection; in this
  present case we create one sucj object, with our credentials to
  enter `faraday`;
* `SshJob` is a class that allows to describe what commands we want to
  run in an `SshNode`, here one single command is needed;
* `Scheduler` is the class that runs a collection of `SshJob`s - even
  if in our case we only have one, we will soon see why this is useful
  when several nodes are active at the same time.


### The code

Every time we will see a piece of code, you can download the raw code with the right-most button.

<< codeview D1 D1-prep.py previous=A5-ping.py graph=D1.png >>

### Sample output

You should be able to run this script as-is, except for the slice name
that you will need to change manually in the code downloaded from the
link just below the picture above.

    $ python3 D1-images.py
    --- for troubleshooting:
    ssh -i /dev/null your_slicename@faraday.inria.fr ping -c1 google.fr
    ---
    your_slicename@faraday.inria.fr:========== Connected (direct)
    your_slicename@faraday.inria.fr:========== Authorization OK with user your_slicename
    faraday.inria.fr:========== Session started for ping -c1 google.fr
    faraday.inria.fr:PING google.fr (216.58.209.227) 56(84) bytes of data.
    faraday.inria.fr:64 bytes from par10s29-in-f3.1e100.net (216.58.209.227): icmp_seq=1 ttl=52 time=14.2 ms
    faraday.inria.fr:
    faraday.inria.fr:--- google.fr ping statistics ---
    faraday.inria.fr:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    faraday.inria.fr:rtt min/avg/max/mdev = 14.299/14.299/14.299/0.000 ms
    faraday.inria.fr:========== Session ended for ping -c1 google.fr
    your_slicename@faraday.inria.fr:========== Connection lost None
    orchestrate - True

### Next

We will now see [in tab D2 how to specify your slice name on the
command line](javascript:open_tab('D2')), and other good practices.

</div>

<!------------ D2 ------------>
<div id="D2" class="tab-pane fade" markdown="1">

### Objectives

We now see a slightly different version of the same experiment, but

* using standard python's `argparse` module, we let users specify
  their slice on the command line with `--slice inria_your.own.slice`
  without having to edit the source.

* we introduce the `Run` class, that is a companion to `SshNode`, and
  that states that `ping` is to be run on the remote side as a
  standard command, supposed to be preinstalled. We will see shortly
  that other types of commands can be used, like providing shell
  scripts, or dealing with files.

* finally, we show a good practice, which is to have your script
  return a meaningful return code to the OS, using `exit()`. A process
  is expected to `exit(0)` when everything is going fine.

### The code

<< codeview D2 D2-images.py previous=D1-prep.py >>

### Sample output

So with all this in place you can now run the downloaded script; you
will notice the disappearance of the verbose messages that gave
details on the establishment of ssh connections and sessions, that you
can now turn back on by adding `-v` or `--verbose` to the options

    $ python3 D2-images.py -s your_slicename
    --- for troubleshooting:
    ssh -i /dev/null your_slicename@faraday.inria.fr ping -c1 google.fr
    ---
    faraday.inria.fr:PING google.fr (216.58.209.227) 56(84) bytes of data.
    faraday.inria.fr:64 bytes from par10s29-in-f3.1e100.net (216.58.209.227): icmp_seq=1 ttl=52 time=14.2 ms
    faraday.inria.fr:
    faraday.inria.fr:--- google.fr ping statistics ---
    faraday.inria.fr:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    faraday.inria.fr:rtt min/avg/max/mdev = 14.262/14.262/14.262/0.000 ms

### Next
In [the next tutorial in tab D3](javascript:open_tab('D3')) we will see how to run commands in a node rather than on the gateway.

</div>

<!------------ D3 ------------>
<div id="D3" class="tab-pane fade" markdown="1">

### Objective : controlling a node beyond the gateway

This time, we want to run the same `ping` command, but from a node,
and not from the gateway.

<center><img src="/assets/img/D3.png" alt="a3" height="240px"></center>

To this end, we only need to build a second instance of an `SshNode`,
that leverages on the one we had created to join the gateway.  This is
achieved by creating an `SshNode` object with the `gateway = `
argument.

This materializes the fact that we reach node `fit01` through the
gateway. It also ensures that only one ssh connection gets established
to the gateway, regardless of the number of nodes actually controlled.

### The code

<< codeview D3 D3-images.py previous=D2-images.py >>

### Sample output

    $ python3 D3-images.py -v
    --- for troubleshooting:
    ssh -i /dev/null your_slicename@faraday.inria.fr ssh root@fit01 ping -c1 google.fr
    ---
    your_slicename@faraday.inria.fr:========== Connected (direct)
    your_slicename@faraday.inria.fr:========== Authorization OK with user your_slicename
    root@fit01:========== Connected (tunnelled)
    root@fit01:========== Authorization OK with user root
    fit01:========== Session started for ping -c1 google.fr
    fit01:PING google.fr (216.58.209.227) 56(84) bytes of data.
    fit01:64 bytes from par10s29-in-f3.1e100.net (216.58.209.227): icmp_seq=1 ttl=51 time=14.6 ms
    fit01:
    fit01:--- google.fr ping statistics ---
    fit01:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit01:rtt min/avg/max/mdev = 14.657/14.657/14.657/0.000 ms
    fit01:========== Session ended for ping -c1 google.fr
    root@fit01:========== Connection lost None

### Next

In the next improvement, we see [in tab D4 how to check for leases before](javascript:open_tab('D4')) running our experiment.

</div>

<!------------ D4 ------------>
<div id="D4" class="tab-pane fade" markdown="1">

### Objectives

Our experiment now performs the exact same thing, but before it does
anything, it will check that we do have a valid reservation.

This will allow us to

* first, implement a good practice, because at this point your ssh
  access to the gateway is essentially opened once and for good; so it
  is a good idea to check for this early on, so you do not get error
  messages later on, at a point where the actual cause might be harder
  to figure;

* second, it will us a chance to this time run one command on the
  gateway and one command on the node, and so to get a first glimpse
  at how to deal with that.

### `asynciojobs` basics

The important things to note here are that

* a `Scheduler` object is filled with any number of jobs; the
  order in which jobs are defined and added to the scheduler has no
  meaning whatsoever.

* the only thing that truly matters is the set of `requires`
relationships between the jobs in the scheduler.  So in our example,
we just run 2 jobs in sequence, so the second one is defined with
`requires = check_lease`.

* a `Scheduler` does not propagate result values from one job to its
successors.  The only logic that a `Scheduler` knows about is that if
one of its jobs raises an exception, and when that job is `critical`,
the scheduler then bails out immediately.

* In our case, `rhubarbe leases --check` returns 0 when you currently
  own the reservation, and 1 otherwise, so by defining `check_lease`
  as `critical` we ensure that the overall scenario will fail
  immediately if we do not own the reservation at that time.

### The code

<< codeview D4 D4-images.py previous=D3-images.py >>

### Sample output

    $ python3 D4-images.py -s your_slicename
    faraday.inria.fr:Checking current reservation for your_slicename OK
    fit01:PING google.fr (216.58.209.227) 56(84) bytes of data.
    fit01:64 bytes from par10s29-in-f3.1e100.net (216.58.209.227): icmp_seq=1 ttl=51 time=14.5 ms
    fit01:
    fit01:--- google.fr ping statistics ---
    fit01:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit01:rtt min/avg/max/mdev = 14.593/14.593/14.593/0.000 ms

Or, when using a slice that is valid but that does not have the reservation right now:

    $ python3 D4-images.py -s inria_inria.oai.oai_build
    faraday.inria.fr:Checking current reservation for inria_inria.oai.oai_build WARNING: Access currently denied

### Next

Let us now see [how to use other network interfaces](javascript:open_tab('D5')).
</div>


<!------------ D5 ------------>
<div id="D5" class="tab-pane fade" markdown="1">

### Objectives

This time, we are going to run ping between two nodes in the testbed,
over the `data` wired network.

<center><img src="/assets/img/D5.png" alt="a5" height="240px"></center>

Each R2lab node has 4 network interfaces (not counting the special
`reboot` interface, that can reset and reboot the node, but that is
not visible from a linux kernel).  With the images that we offer, here
is how these 4 four interfaces are managed:

* `control` is
  * a wired interface, it is the one that you actually use when you ssh into the node for the first time;
  * it is automatically turned on when you boot,
  * it is known as e.g. `fit01`, and sits on the `192.168.3.0/24` subnet;

* `data` is
  * another wired interface,
  * that is **NOT** turned on automatically at boot time,
  * since it is dedicated for your usage, so you can turn it on or off as you please
  * even using DHCP if it is convenient for you; in this case its IP address
    will be on `192.168.2.x/24` and known to DNS as e.g. `data01`

* `atheros`, and `intel`
  * both are the 2 WiFi interfaces,
  * that are also **NOT** turned on automatically at boot-time
  * so it is your entire responsability to set them up.

We will see how to manage the wireless interfaces [in the next
tutorial](tuto-500-B-wireless.md).

But for now we will run ping from `fit01` to `fit02`, and using the `data` interface on each node, so we can see how to turn these on and off.

Here is what deserves to be outlined in the code below

* on all nodes you will find a command named `turn-on-data`; this of course
  is not a standard command, it is preinstalled on the nodes for your
  convenience. It's job is to turn on the data interface using DHCP.

* you will find this command documented if you type `help` when logged
  on any node;

* take a look [at the source code for similar utilities
  here](https://github.com/parmentelat/r2lab/blob/master/infra/user-env/nodes.sh)

* also notice how we can very easily make sure to run our ping once
  **BOTH** nodes have configured their data interface, by just using 2
  jobs in the `requires` attribute of the ping job;

* Finally, notice how at the epilogue we check that the ping command
  actually succeeded, by using `result()` on a `SshJob` instance.

### The code

<< codeview D5 D5-images.py previous=D4-images.py >>

### Sample output

    $ D5-images.py -s your_slicename && echo OK
    faraday.inria.fr:Checking current reservation for your_slicename OK
    fit02:Turning on data network on interface data
    fit01:Turning on data network on interface data
    fit01:data
    fit02:data
    fit01:PING data02 (192.168.2.2) from 192.168.2.1 data: 56(84) bytes of data.
    fit01:64 bytes from data02 (192.168.2.2): icmp_seq=1 ttl=64 time=0.244 ms
    fit01:
    fit01:--- data02 ping statistics ---
    fit01:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit01:rtt min/avg/max/mdev = 0.244/0.244/0.244/0.000 ms
    OK

### Next

We can now [wrap up this D-series](javascript:open_tab('WRAPUP')).

</div>

<!------------ WRAPUP ------------>
<div id="WRAPUP" class="tab-pane fade" markdown="1">


* how we can add an image loading feature in a `nepi-ng` script (in C4);



### Summary
At this point, you should have a rather good understanding of the following fundamentals of R2lab:

### Interfaces

Each node has 4 network interfaces, `control` being considered
reserved for testbed administration, the other ones being reserved for
the experimenter who is in charge of setting them up.

### `nepi-ng`

By leveraging the standard `asyncio` library, and by combining the
`asynciojobs` and `apssh` libraries on top of that, it is possible to
write scripts that are

* reasonably simple and short
* able to run as many jobs as needed simultaneously and in a single thread
* able to deal with simple synchronization constraints.

### Next

In [the next tutorial](tuto-500-B-wireless.md), we will see how to deal
with the more complex task of setting up a wireless network.

In [the tutorial after that](tuto-600-C-files.md), we will address file
transfers to and from `SshNode`s.

</div>

</div> <!-- end div contents -->
