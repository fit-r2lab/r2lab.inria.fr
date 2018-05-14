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

Every time we will see a piece of code, you can download the raw code
with the right-most button.

<< codeview D1 D1-prep.py previous=A5-ping.py graph=D1.png >>

### Sample output

Here's the output of the script when run with the `-l` option.

<< togglableoutput D1out D1.out "$ python3 D1-prep.py -l" >>

### Next

We will now see [in tab D2 how to also make sure all the rest of the testbed
is turned off](javascript:open_tab('D2')).

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

<< togglableoutput D2out D2.out "$ python3 D2-prep.py -l" >>

### Next

We will now see [in tab D3 how to pass target nodes on the command-line](javascript:open_tab('D3')).

</div>

<!------------ D3 ------------>
<div id="D3" class="tab-pane fade" markdown="1">

### Objectives

In this section, we will change the `D2` script so that the target nodes can be
passed on the command line, instead of using the hardwired nodes 1 and 2.

### The `r2lab` python library

We take this opportunity to introduce the `r2lab` python library,
that you need of course to install separately:

    pip3 install r2lab

This library is designed to be, and hopefully to stay, very small;
in this example we just use convenience functions like `r2lab_hostname`
that lets us compute the [hostname for one of the nodes from a variety of inputs](http://r2lab.readthedocs.io/en/latest/API.html#r2lab.utils.r2lab_hostname),
that can be either `int` or `bytes` or `str`.

This mostly is convenient to avoid ending up with hostname like `fit1`
with a missing `0`, so as you can see it is very basic.


A complete reference can be [found on readthedocs.io](http://r2lab.readthedocs.io).

### The code

<< codeview D3 D3-prep.py previous=D2-prep.py graph=D3.png >>


### Sample output

It is easy to select other nodes with the `-a` and `-b` option.

<< togglableoutput D3out D3.out "$ python3 D3-prep.py --load --node-a 10 --node-b 20" >>

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
