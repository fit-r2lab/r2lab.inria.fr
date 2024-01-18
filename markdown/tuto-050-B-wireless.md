title: nepi-ng - B - wireless
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>

<div class="container" markdown="1">

<< tuto_tabs "INTRO": "B1": "B2": "B3": "B4": "B5": "WRAP UP":WRAPUP >>


<div id="contents" class="tab-content" markdown="1">

<!-- ------- INTRO ------------>
<div id="INTRO" class="tab-pane fade show active" markdown="1">

### Prerequisites

For this series of experiments, we make the same assumptions as in the
previous series. In a nutshell, we expect you have a valid
reservation, and the 2 nodes `fit01`and `fit02` are properly loaded with
the default image, and turned on of course.

Please [visit this page](http://r2lab.inria.fr/tuto-040-A-ping.md#INTRO)
to review how to reach that point, if necessary.

### Objectives

In this series we will start playing with the wireless interfaces. Of
course a minimal background is assumed in terms of dealing with
wireless interfaces under linux; further information can be found at
the following locations :

* we recommend to see [this quick introduction to `iw`, that is
  instrumental in these
  tasks](https://wireless.wiki.kernel.org/en/users/documentation/iw)

* as well as [this helpful page on how to use `iw` if you were more
  familiar with `iwconfig` that is now considered
  obsolete](https://wireless.wiki.kernel.org/en/users/documentation/iw/replace-iwconfig) -
  much like `ip` has now replaced `ifconfig`.

### `nepi-ng`

Now as far as `nepi-ng` is concerned, in the previous series we have
seen ways to run remotely simple commands. In this section we will see
simple means to come up with more complex logic, simply by using shell
scripts that are pushed remotely under the hood before they are
triggered. This is what the `RunString` and `RunScript` classes are
about. Let us [see them in action right away](javascript:open_tab('B1')).


</div>

<!-- ------- B1 ------------>
<div id="B1" class="tab-pane fade" markdown="1">

### Objective

We are going to run the exact same experiment [as in the previous run
A5](tuto-040-A-ping.md#A5), that is to say a simple ping triggered on
`fit01` towards `fit02`, but this time on one of the **wireless
interfaces**.

<center> <img src="/assets/img/B1.png" alt="b1" height="240px"></center>

What changes then, as compared with our previous experiment, is that
we cannot anymore simply run the predefined convenience command
`turn-on-data`, and we are going to have to put a little more work in this
step.

We are going to configure a small *ad hoc* network between both nodes,
using their Atheros WiFi card, and this is the purpose of the bash
shell script named `turn_on_wireless_script`; as you will see, this
script uses some hard-wired settings like the channel and SSID, but
you can easily tweak the code so as to make this a parameter.

### New features

The `B1 code` below exhibits the use of a new class, `RunString`,
which is a very convenient variation around the `Run` class.

Instead of remotely invoking a command that is supposed to be
available there already, like we have done so far when e.g. invoking
`ping` or even `turn-on-data`, `RunString` allows you to invoke a command
that we provide **as a python variable**.

This means that we can write our own shell snippet, in charge of
creating a small ad-hoc network, and embed this script right inside
our nepi-ng script; see the `turn_on_wireless_script` variable in the
code below.

See also how the `init_node_01` job now uses `RunString` to pass it
python variables as arguments. For example this is how
`turn_on_wireless_script` gets passed the right IP address for each node.

As you will see in the sample output below, it takes some time for the
IP connectivity to be established after the driver is configured.

### The code

<< codeview B1 B1-wireless.py previous=A5-ping.py graph=B1.png >>

### Sample output

<< togglableoutput B1out B1.out "$ python3 B1-wireless.py" >>

### Next

Let us see some variants on that theme [in the next tab](javascript:open_tab('B2'))

</div>

<!-- ------- B2 ------------>
<div id="B2" class="tab-pane fade" markdown="1">

### Objective

In this new variant, we are going to illustrate a few convenient tricks:

* we add a new option to the script so that one can choose, right on
  the command line, whether we want to use the intel or the atheros
  WiFi card; this simply relies on the [standard argparse
  module](https://docs.python.org/3/library/argparse.html) that we
  have already used for other options, the only new thing being the
  use of the `choices` keyword, so that only the 2 supported driver
  names can be used;

* more interestingly, we can remove the `wireless_interface` variable
  from that script altogether, thanks to a shell utilily available on
  all nodes and named `wait-for-interface-on-driver`. This shell
  function returns the name of the network interface associated with a
  given driver name, so it is enough to load, say, module `ath9k` and
  let this function figure out that the actual interface name is
  `atheros`;

* in much the same way, we will remove the need to pass an IP address
  to the `turn_on_wireless_script`, by computing this address based on
  the node rank in r2lab, using another convenience tool named
  `r2lab-ip`; there actually are 2 similar functions available on each node

  * `r2lab-ip`: will return the number of the current node, under **1 or 2 digits**;
    for example on node 8, this returns `8`;
    this is suitable to build IP addresses;


  * `r2lab-id`: will return the number of the current node, but **always in 2 digits**;
    for example on node 8, this returns `08`;
    this is suitable to build hostnames; so for example you would do

#

    my_data_hostname="data$(r2lab-id)"
    echo $my_data_hostname
    data08
    my_wireless_ip_address="10.0.0.$(r2lab-ip)"
    echo my_wireless_ip_address
    10.0.0.8

* finally, this new script displays the outputs of the ssh commands
  with a slightly different format, in that every line will now
  receive a timestamp in addition to the hostname. This is achieved
  through the use of the `TimeColonFormatter()` class; we create one
  instance of this class for each instance of `SshNode`.

So for example we would issue lines like

    14-37-28:fit01:turn-off-wireless: shutting down device intel

  instead of just

    fit01:turn-off-wireless: shutting down device intel

About that last point, note that other types of formatters are
  available, that will let you store output in a given directory, and
  in files named after each individual hostname. See [this
  page](http://apssh.readthedocs.io/en/latest/API.html#module-apssh.formatters)
  for more info on other available formatters.


### The code

<< codeview B2 B2-wireless.py previous=B1-wireless.py graph=B2.png >>

### Sample output

<< togglableoutput B2out B2.out "$ python3 B2-wireless.py" >>

### Next

In [the next variant](javascript:open_tab('B3')), we are going to see
how we can better esimate the time it takes for the ad hoc network to
actually come up.

</div>

<!-- ------- B3 ------------>
<div id="B3" class="tab-pane fade" markdown="1">

### Objective

In this variant, we will see how we can even design our experiment so
that all **the shell code** goes **in a single file**, working as a
companion for the python script that will only deal with overall
logic.

Our pretext for doing so is that we would like to better understand
the startup sequence observed in the previous runs B1 and B2. And for
doing that it is not good enough to just run `ping` like we did, but
instead we would need run something a little more elaborate - that
we'll write in shell.

As much as it is convenient to have the ability to insert shell script
right in the python code, when things become more complex, the shell
code tends to become in the way.

So, two features are at work in the following code

* Using `RunScript` instead of `RunString` as a way to define commands
  allows us to separate the shell script in a separate file.

* Also you can note at the end of the shell script, a very simple
  trick that lets you group any number of functions in a shell script,
  and call each individual function by just stating its name and arguments.

In other words, it means that if you write the following in a file named `myscript.sh`:

<code>
<pre>
<<include myscript.sh >>
</pre>
</code>

and then you invoke `myscript.sh foo 1 2 "3 4"` you will get this ouput

    $ myscript.sh foo 1 2 "3 4"
    in function foo
    foo arg:  1
    foo arg:  2
    foo arg:  3 4

### The code

Make sure you download both files in the same location before trying to run the python script.

<< codeview B3 B3-wireless.py previous=B2-wireless.py graph=B3.png >>

<< codeview B3SHELL B3-wireless.sh >>

### Sample output

<< togglableoutput B3out B3.out "$ python3 B3-wireless.py" >>

### Next

Let us proceed on this series with [an example that adds a
cyclic task](javascript:open_tab('B4')) to this scenario.

</div>

<!-- ------- B4 ------------>
<div id="B4" class="tab-pane fade" markdown="1">

### Objective

In this example, we will just for fun add an
infinite cyclic task in the scheduler. Here we will simply write a TICK
mark every second, but this technique is most useful for consuming
events in a message queue, or any other similar approach.

The trick is to use the plain `Job` class from `asynciojobs`, which
expects a regular `asyncio` coroutine object, that we implement as
`infinite_clock()`. We just need to define the associated job
`clock_job` with `forever = True`, which tells the scheduler that this
job never ends, so that it knows that there is no point in waiting for
it to complete.

### More on graphical views

Note in this example that, with respect to the graphical representation of
schedulers:

* each job needs a specific label to be displayed in such a graph - as
  well as in `list()` and `debrief()` by the way

* the system does its best to provide a meaningful label, but

* you are always free to define your own label on a given job, like we
  do here with the `infinite clock` job.


### The code

<< codeview B4 B4-wireless.py previous=B3-wireless.py graph=B4.png>>

### Sample output

<< togglableoutput B4out B4.out "$ python3 B4-wireless.py" >>

### Next

In [the next example](javascript:open_tab('B5')),
we will see a convenience class named `Watch`, that comes in
handy in most experiments as it allows to keep track of elapsed time since the beginning of an experiment.

</div>

<!-- ------- B5 ------------>
<div id="B5" class="tab-pane fade" markdown="1">

### Objective

In this final example in the series, we will take the chance to illustrate
a convenience class named `Watch` from `asynciojobs`, that allows to keep
track of elapsed time since some reference point in time, generally the
beginning of the experiment.

So here, we create a `Watch` instance, and use it when the clock is ticking,
instead of showing plain wall clock time.

### The code

<< codeview B5 B5-wireless.py previous=B4-wireless.py graph=B5.png >>

### Sample output

<< togglableoutput B5out B5.out "$ python3 ./B5-wireless.py">>

### Next

It is now [time to wrap up this series](javascript:open_tab('WRAPUP')).

</div>

<!-- ------- WRAPUP ------------>
<div id="WRAPUP" class="tab-pane fade" markdown="1">

We now know how to:

* have local scripts executed remotely; we have seen that we can either
  * write them as plain shell scripts - using `RunScript`,
  * or embed them right in python strings - using `RunString`;

* obtain remote outputs using alternate formats, using
  e.g. `TimeColonFormatter`; see [this
  page](http://apssh.readthedocs.io/en/latest/API.html#module-apssh.formatters)
  for more info on other available formatters;

* run infinite jobs, that will get properly terminated when all the
  finite jobs in the scenario are done;

* use the `Watch` class to keep track of elapsed time,
  as opposed to displaying wall clock time.

In [the next series of tutorials](tuto-060-C-files.md), we will learn
more about transferring files back and forth.

</div>

</div> <!-- end div contents -->

</div> <!-- end div container -->
