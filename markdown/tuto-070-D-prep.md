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

To this end we will improve our script so that it takes care of initializations,
and specifically we will add a command line option that, when enabled:

* loads the `ubuntu` image on the nodes that we do use,
* and makes sure that all the nodes that we do not use are actually turned off.

It is a rather common need for all experiments to take these aspects into
account. We do recommend to make image loading an option though, since
performing this for every run vey quickly gets in the way when fine-tuning your
experiment.

Please note that the script **will not** try to **get a lease**
automatically, instead we keep the simple policy of **just checking** that
we have a valid lease.

Like always, we will improve the code by small incremental changes.

### Important note on shell tools

**Convenience tools are mostly just aliases**

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

### How to find out long commands

For starters, as a rule of thumb, all convenience commands that are derived from
`rhubarbe` are made up the same way. Just like `rleases` is an alias for
`rhubarbe leases`,  you will find that `rbye` is an alias for `rhubarbe bye`.


    inria_r2lab.tutorial@faraday:~$ type rload
    rload is aliased to `rhubarbe load'
    inria_r2lab.tutorial@faraday:~$ type rwait
    rwait is aliased to `rhubarbe wait'


As you can see, it is very easy to find out about a given command when logged on
faraday, using `bash`'s built-in `type` command; note that `type` is much more
powerful and accurate than the old-school `which` thing, that is only able to
locate a command along your path, while `type` knowns about aliases and
functions as well.

    inria_r2lab.tutorial@faraday:~$ which rwait
    inria_r2lab.tutorial@faraday:~$

### How to use short commands in scripts

Finally, note that you can expose short commands in your scripts by adding
a line Like this in your shell script:

    # this would define e.g. the 'rwait' command
    source /etc/profile.d/faraday.sh


The same goes of course for convenience tools exposed from the nodes
environment; as we have seen on a few occasions before, if you need to use any
of these commands in code meant to run on nodes, you can insert this line in
your bash script:

    # this would define e.g. the `r2lab-id` command
    source /etc/profile.d/nodes.sh


All this being said, let us now see [in the next tab
D1](javascript:open_tab('D1')) how to extend the A5 script and turn it into D1
that knows how to load images.

</div>


<!------------ D1 ------------>
<div id="D1" class="tab-pane fade" markdown="1">

### Objective

When working on an experiment, you will find yourself making several
reservations, as not everything works as planned the first time.

For this reason it is useful to design your experiment script so that it can be
used both:

* at the beginning of your reserved timeslot, and in this case you will need the
  script to load the image of your choice on the nodes,

* or the rest of the time, when you just need to re-run everything, but not to
  necessarily to reload images, given that this is relatively time-consuming.


### Starting point

It is the purpose of the present step, to show you how to simply add a command
line option that, when provided, triggers image loading.

For this step, we start back from the last code in the A section - namely
`A5-ping.py`, remember:

<center> <img src="/assets/img/A5.png" alt="d1" height="240px"></center>

### The code

Every time we will see a piece of code, you can download the raw code with the right-most button.

<< codeview D1 D1-prep.py previous=A5-ping.py graph=D1.png >>

### Sample output

Here's the output of the script when run with the `-l` option.

    $ python3 D1-prep.py -l
    faraday.inria.fr:Checking current reservation for inria_r2lab.tutorial : OK
    faraday.inria.fr:Found binary frisbeed as /usr/sbin/frisbeed
    faraday.inria.fr:Found binary nc as /bin/nc
    faraday.inria.fr:12:51:00 - +000s: Selection: fit01 fit02
    faraday.inria.fr:12:51:00 - +000s: Loading image /var/lib/rhubarbe-images/ubuntu.ndz
    faraday.inria.fr:12:51:00 - +000s: AUTH: checking for a valid lease
    faraday.inria.fr:12:51:00 - +000s: AUTH: access granted
    faraday.inria.fr:12:51:00 - +000s: fit01 reboot = Sending message 'reset' to CMC reboot01
    faraday.inria.fr:12:51:00 - +000s: fit02 reboot = Sending message 'reset' to CMC reboot02
    faraday.inria.fr:12:51:02 - +002s: fit01 reboot = idling for 15s
    faraday.inria.fr:12:51:02 - +002s: fit02 reboot = idling for 15s
    faraday.inria.fr:12:51:18 - +018s: started <frisbeed@234.5.6.1:10001 on ubuntu.ndz at 500 Mibps>
    faraday.inria.fr:12:51:18 - +018s: fit01 frisbee_status = trying to telnet..
    faraday.inria.fr:12:51:18 - +018s: fit02 frisbee_status = trying to telnet..
    faraday.inria.fr:12:51:20 - +020s: fit01 frisbee_status = timed out..
    faraday.inria.fr:12:51:20 - +020s: fit01 frisbee_status = backing off for 3.25s
    <snip>
    faraday.inria.fr:12:51:35 - +035s: fit02 frisbee_status = trying to telnet..
    faraday.inria.fr:12:51:35 - +035s: fit02 frisbee_status = starting frisbee client
    faraday.inria.fr:12:51:57 - +057s: fit01 Uploading successful
    faraday.inria.fr:12:51:57 - +057s: fit01 reboot = Sending message 'reset' to CMC reboot01
    |###################################################|100% |26.35s|Time: 0:00:260s|ETA:  --:--:--
    faraday.inria.fr:12:51:59 - +058s: fit02 Uploading successful
    faraday.inria.fr:12:51:59 - +058s: fit02 reboot = Sending message 'reset' to CMC reboot02
    faraday.inria.fr:12:52:01 - +061s: stopped <frisbeed@234.5.6.1:10001 on ubuntu.ndz at 500 Mibps>
    faraday.inria.fr:<Node fit01>:ssh OK
    faraday.inria.fr:<Node fit02>:ssh OK
    fit02:turn-on-data: data network on interface data
    fit01:turn-on-data: data network on interface data
    fit02:data
    fit01:data
    fit01:PING data02 (192.168.2.2) from 192.168.2.1 data: 56(84) bytes of data.
    fit01:64 bytes from data02 (192.168.2.2): icmp_seq=1 ttl=64 time=0.461 ms
    fit01:
    fit01:--- data02 ping statistics ---
    fit01:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit01:rtt min/avg/max/mdev = 0.461/0.461/0.461/0.000 ms
    Connection failed to root@fit02 : Connection lost
    Connection failed to root@fit01 : Connection lost
    (Over)wrote D1.dot

### Next

We will now see [in tab D2 how to also make sure all the rest of the testbed is turned off](javascript:open_tab('D2')).

</div>

<!------------ D2 ------------>
<div id="D2" class="tab-pane fade" markdown="1">

### Objectives

In this section we study a variant `D2`, that is naturally based on `D1`, and
that also makes sure that the unused nodes in the testbed are properly turned
off.

### Selection in `rhubarbe`

For doing so, we take advantage of a feature in `rhubarbe`, that is designed to
make node selection a smooth process; in particular we use:

* the `--all` (or just `-a`) option that selects all nodes,
* and the `~` operator for removing nodes from the selection.

So for example

    inria_r2lab.tutorial@faraday:~$ rhubarbe nodes -a
    fit01 fit02 fit03 fit04 fit05 fit06 fit07 fit08 fit09 fit10 fit11 fit12 fit13 fit14 fit15 fit16 fit17 fit18 fit19 fit20 fit21 fit22 fit23 fit24 fit25 fit26 fit27 fit28 fit29 fit30 fit31 fit32 fit33 fit34 fit35 fit36 fit37

selects all 37 nodes, while

    inria_r2lab.tutorial@faraday:~$ rhubarbe nodes -a ~1 ~2
    fit03 fit04 fit05 fit06 fit07 fit08 fit09 fit10 fit11 fit12 fit13 fit14 fit15 fit16 fit17 fit18 fit19 fit20 fit21 fit22 fit23 fit24 fit25 fit26 fit27 fit28 fit29 fit30 fit31 fit32 fit33 fit34 fit35 fit36 fit37

selects all nodes but nodes number 1 and 2. This is the basic mechanism that we use to invoke the `rhubarbe bye` (*a.k.a.* `all-off`) command to turn off all the nodes that are not involved in our experiment.

### requirement(s)

Also you will notice in this code that the `required` value for a given job may
be either a plain job object, or a collection of jobs; in the code above, the
`ready_requirement` variable, that was a single job object in `D1-prep.py`, is
made a list with 2 jobs, and this is how we simply achieve the layout for the
new dependency graph.

### The code

<< codeview D2 D2-prep.py previous=D1-prep.py graph=D2.png >>

### Sample output

No great news here, just observe how all the other nodes, and the phones, get turned off while the 2 target nodes are being imaged.

    $ python3 D2-prep.py -l

    tparment ~/git/r2lab.inria.fr/code (public *+=) $ python3 ./D2-prep.py -l
    faraday.inria.fr:Checking current reservation for inria_r2lab.tutorial : OK
    faraday.inria.fr:Found binary frisbeed as /usr/sbin/frisbeed
    faraday.inria.fr:Found binary nc as /bin/nc
    faraday.inria.fr:reboot26:ok
    faraday.inria.fr:reboot21:ok
    <snip>
    faraday.inria.fr:reboot14:ok
    faraday.inria.fr:reboot07:ok
    faraday.inria.fr:12:55:06 - +000s: Selection: fit01 fit02
    faraday.inria.fr:12:55:06 - +000s: Loading image /var/lib/rhubarbe-images/ubuntu.ndz
    faraday.inria.fr:12:55:06 - +000s: AUTH: checking for a valid lease
    faraday.inria.fr:12:55:06 - +000s: AUTH: access granted
    faraday.inria.fr:12:55:06 - +000s: fit02 reboot = Sending message 'reset' to CMC reboot02
    faraday.inria.fr:12:55:07 - +000s: fit01 reboot = Sending message 'reset' to CMC reboot01
    faraday.inria.fr:reboot16:ok
    faraday.inria.fr:reboot23:ok
    faraday.inria.fr:reboot19:ok
    faraday.inria.fr:reboot30:already off
    faraday.inria.fr:reboot32:already off
    faraday.inria.fr:reboot31:already off
    faraday.inria.fr:reboot10:ok
    faraday.inria.fr:reboot20:ok
    faraday.inria.fr:reboot35:already off
    faraday.inria.fr:reboot22:already off
    <snip>
    faraday.inria.fr:reboot29:already off
    faraday.inria.fr:reboot12:already off
    faraday.inria.fr:reboot11:ok
    faraday.inria.fr:12:55:09 - +002s: fit01 reboot = idling for 15s
    faraday.inria.fr:12:55:09 - +002s: fit02 reboot = idling for 15s
    faraday.inria.fr:reboot25:already off
    faraday.inria.fr:reboot21:already off
    faraday.inria.fr:reboot07:already off
    faraday.inria.fr:ssh -i /home/faraday/r2lab-embedded/mac-ssh-keys/macphone tester@macphone1 phone-off
    faraday.inria.fr:Turning OFF phone : turning on airplane mode
    faraday.inria.fr:Broadcasting: Intent { act=android.intent.action.AIRPLANE_MODE (has extras) }
    faraday.inria.fr:Broadcast completed: result=0
    faraday.inria.fr:ssh -i /home/faraday/r2lab-embedded/mac-ssh-keys/macphone tester@macphone2 phone-off
    faraday.inria.fr:Turning OFF phone : turning on airplane mode
    faraday.inria.fr:Broadcasting: Intent { act=android.intent.action.AIRPLANE_MODE (has extras) }
    faraday.inria.fr:Broadcast completed: result=0
    faraday.inria.fr:12:55:25 - +018s: started <frisbeed@234.5.6.1:10001 on ubuntu.ndz at 500 Mibps>
    faraday.inria.fr:12:55:25 - +018s: fit01 frisbee_status = trying to telnet..
    faraday.inria.fr:12:55:25 - +018s: fit02 frisbee_status = trying to telnet..
    <snip>
    faraday.inria.fr:12:55:42 - +035s: fit02 frisbee_status = trying to telnet..
    faraday.inria.fr:12:55:42 - +035s: fit02 frisbee_status = starting frisbee client
    faraday.inria.fr:12:56:03 - +056s: fit01 Uploading successful
    faraday.inria.fr:12:56:03 - +056s: fit01 reboot = Sending message 'reset' to CMC reboot01
    |###################################################|100% |24.73s|Time: 0:00:240s|ETA:  --:--:--
    faraday.inria.fr:12:56:04 - +058s: fit02 Uploading successful
    faraday.inria.fr:12:56:04 - +058s: fit02 reboot = Sending message 'reset' to CMC reboot02
    faraday.inria.fr:12:56:07 - +060s: stopped <frisbeed@234.5.6.1:10001 on ubuntu.ndz at 500 Mibps>
    faraday.inria.fr:<Node fit01>:ssh OK
    faraday.inria.fr:<Node fit02>:ssh OK
    fit02:turn-on-data: data network on interface data
    fit01:turn-on-data: data network on interface data
    fit01:data
    fit02:data
    fit01:PING data02 (192.168.2.2) from 192.168.2.1 data: 56(84) bytes of data.
    fit01:64 bytes from data02 (192.168.2.2): icmp_seq=1 ttl=64 time=0.489 ms
    fit01:
    fit01:--- data02 ping statistics ---
    fit01:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit01:rtt min/avg/max/mdev = 0.489/0.489/0.489/0.000 ms
    Connection failed to root@fit02 : Connection lost
    Connection failed to root@fit01 : Connection lost
    (Over)wrote D2.dot

### Next

We will now see [in tab D3 how to pass target nodes on the command-line](javascript:open_tab('D3')).

</div>

<!------------ D3 ------------>
<div id="D3" class="tab-pane fade" markdown="1">

### Objectives

In this section, we will change the `D2` script so that the target nodes can be
passed on the command line, instead of using the hardwired nodes 1 and 2.

### The code

<< codeview D3 D3-prep.py previous=D2-prep.py graph=D3.png >>


### Sample output

It is easy to select other nodes with the `-a` and `-b` option. 

    tparment ~/git/r2lab.inria.fr/code (public *+=) $ python3 ./D3-prep.py -a 10 -b 20
    faraday.inria.fr:Checking current reservation for inria_r2lab.tutorial : OK
    fit20:turn-on-data: data network on interface data
    fit10:turn-on-data: data network on interface data
    fit20:data
    fit10:data
    fit10:PING data20 (192.168.2.20) from 192.168.2.10 data: 56(84) bytes of data.
    fit10:64 bytes from data20 (192.168.2.20): icmp_seq=1 ttl=64 time=0.457 ms
    fit10:
    fit10:--- data20 ping statistics ---
    fit10:1 packets transmitted, 1 received, 0% packet loss, time 0ms
    fit10:rtt min/avg/max/mdev = 0.457/0.457/0.457/0.000 ms
    Connection failed to root@fit20 : Connection lost
    Connection failed to root@fit10 : Connection lost
    (Over)wrote D3.dot

### Next

We can now [wrap up this D-series](javascript:open_tab('WRAPUP')).

</div>

<!------------ WRAPUP ------------>
<div id="WRAPUP" class="tab-pane fade" markdown="1">

### Summary
You now have a complete toolset at your disposal, and should be able to create `nepi-ng` scripts for
writing a real scale experiment, including that involve setting up nodes from scratch, and account for any node that the previous experimenter may have forgotten to switch off.

### Next

Let us move to [the next tutorial](/tuto-110-troubleshooting.md)
for some guidelines and troubleshooting tips.

</div>

</div> <!-- end div contents -->
