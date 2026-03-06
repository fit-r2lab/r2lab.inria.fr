title: nepi-ng - troubleshooting
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>

<div class="container" markdown="1">

<< tuto_tabs "INTRO": "COMMON MISTAKES":COMMONMISTAKES "CODE UPDATE":CODEUPDATE "VERBOSITY": "HANGING": >>

<div id="contents" class="tab-content" markdown="1">

<!-- ------- INTRO ------------>
<div id="INTRO" class="tab-pane fade show active" markdown="1">

# Objectives

In this page we are going to see a few guidelines for troubleshooting
a `nepi-ng` script.

This tuto is organized in several parts

* Common mistakes : works as a simple checklist that should let you
  figure out the most common mistakes.

* Code updates : check to see if you're running the latest versions of the code

* Verbosity : how to enable more logging messages from your script

* Hanging : how to deal with a scheduler that never completes
  and you do not understand why

</div>

<!-- ------- COMMONMISTAKES ------------>
<div id="COMMONMISTAKES" class="tab-pane fade" markdown="1">

## Check for the obvious

Before you start diving in the code, it is **always** a good idea to
step back a little, and to check for the following common mistakes.

This is especially true when you start with `nepi-ng` and `R2lab`, and
your scripts are not sophisiticated enough to do all these checks by
themselves.

The following common sources of glitches happen frequently in
situations where you were working on your scenario, and then your time
went up. So you just come back to the testbed, you should check for the following:

### Do you have a valid reservation on the testbed ?

If your script does not check for that, it's a good idea to double check
on e.g. <https://r2lab.inria.fr/book.md>.

### Can you reach `faraday` via ssh ?

Try to enter the gateway with this simple command

    ssh your_slicename@faraday.inria.fr

If this does not work, then double check that your private ssh key
is known to your ssh agent - especially if you have recently logged out :

    ssh-add -l

### Are the nodes up ? Do they run the expected image ?

You can check all your nodes directly [in the RUN page](run.md) on the web
site, or with a session like this (when logged in `faraday`), assuming
that you need nodes 4, 6 and from 10 to 13 inclusive :


    $ rleases --check
    Checking current reservation for inria_r2lab.tutorial OK

    # select your nodes
    inria_r2lab.tutorial@faraday:~$ n 4 6 10-13
    export NODES="fit04 fit06 fit10 fit11 fit12 fit13"
    export NBNODES=6

    # check they are reachable through ssh - use the --timeout option if needed
    inria_r2lab.tutorial@faraday:~$ rwait
    <Node fit04>:ssh OK
    <Node fit06>:ssh OK
    <Node fit10>:ssh OK
    <Node fit11>:ssh OK
    <Node fit12>:ssh OK
    <Node fit13>:ssh OK

    # what image are they all running ?
    inria_r2lab.tutorial@faraday:~$ map rimage
    fit04:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial
    fit10:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial
    fit06:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial
    fit13:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial
    fit11:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial
    fit12:2016-11-29@00:12 - built-on fit03 - from-image fedora-23-v10-wireless-names - by inria_r2lab.tutorial


Otherwise, check out [the next section on code updates.](javascript:open_tab('CODEUPDATE')).
</div>

<!-- ------- CODEUPDATE ------------>
<div id="CODEUPDATE" class="tab-pane fade" markdown="1">

The software involved in R2lab, either `nepi-ng` or the shell
utilities, are evolving quickly, especially during the current rollout
period.

So here's how you can check for possibly out-dated versions of either of these :

### `python3`

Please double check that you

* indeed run python-3.6 or higher
* and that you indeed use `python3` to run your script - it is so easy to
  forget the `3` in `python3 A1-ping.py` !

### `nepi-ng`

You can make sure that you run the latest version of `nepi-ng` by running

    [sudo] pip3 install --upgrade apssh

Alternatively, you can check the currently running versions by doing on your laptop

    $ python3 -c 'from asynciojobs import version; print(version.__version__)'
    $ python3 -c 'from apssh import version; print(version.__version__)'

and then compare them against the latest release numbers for these 2
libraries, that can be found :

* either by searching `https://pypi.python.org`,
* or in the respective documentation pages for
[asynciojobs](http://asynciojobs.readthedocs.io/) and
[apssh](http://apssh.readthedocs.io/).

### `r2lab` python library

Similarly, you may have to upgrade the python library

    [sudo] pip3 install -U r2lab

### `shell tools`

The shell tools are used

* on `faraday` itself, but you can consider this is always up-to-date,
* as well as on the nodes themselves; and in this case, the version of
the R2lab convenience tools - like `turn-on-data` or other `r2lab-id`
or similar tools - that you use depends on **the date where your image
was created**.

This is why it is always a good idea to have your shell scripts,
whenever they source `/root/r2lab-embedded/shell/node.sh`, call
`git-pull-r2lab` which will update the whole repository `/root/r2lab-embedded`
from the latest version published on github.

Otherwise, check out [the next section on verbosity in your scripts.](javascript:open_tab('VERBOSITY')).
</div>

<!-- ------- VERBOSITY ------------>
<div id="VERBOSITY" class="tab-pane fade" markdown="1">

OK, so you have tried everything else, you can't seem to find why your
script does not behave like you expected it to. Here's a brief
description of the various levels of verbosity that you can enable in
your script.

# `Scheduler.debrief()`

In all our examples so far, you have noticed that we always run a
scheduler like this :

    # run the scheduler
    ok = scheduler.run()
    # give details if it failed
    ok or scheduler.debrief()

This means that, if ever `run()` does not return `True`, we
run the `debrief()` method on that scheduler.

Keep in mind that `run` orchestration returns `False` only in
either of these 2 cases:

* one of the *critical* jobs inside the scheduler has raised an exception,
* or, when dealing with a scheduler that has an attached timeout
  - e.g. created as `Scheduler(timeout=120)` -
  if the total duration of `run` exceeds that timeout.

So if `run()` returns `False`, and you have not specified a
global timeout, it means you are in the first situation; and by
calling `debrief()` like we have done in all the tutorials, you will
see more details on the critical job that has caused the scheduler to
bail out.

# Structure of the scheduler

The programming style used to create a `Scheduler` instance and to add
jobs in it can sometimes lead to unexpected results. Typical mistakes
generally involve

* erroneous `required` relationsships,
* and jobs with wrong *criticality*.

You have several
means to check it for mistakes

### Checking contents

The `Scheduler.list()` method allows you to see an overview of your
`Scheduler` object, in terms of the jobs it contains, and their
`required` relationship. You can use it anytime, before or after you
orchestrate the scheduler, but if your script behaves oddly it might
be a good idea to check the scheduler before running it

     # just before you trigger run()
     shceduler.list()

You can even ask for more details

    scheduler.list(details=True)

`Scheduler.list()` uses some symbols in the hope to provide meaningful
information in a condensed way, you [can refer to this
page](http://nepi-ng.inria.fr/asynciojobs/README.html#inspecting-scheduler-and-results-scheduler-list)
to see the meaning of the different symbols, but in a nutshell:

* `⚠` : critical
* `★` : raised an exception
* `☉` : went through fine (no exception raised)
* `☓` : complete
* `↺` : running
* `⚐` : idle
* `∞` : forever


### Graphical view

As we [have already seen in C3bis](tuto-060-C-files.md#C3bis), it is
rather easy to produce a *png* file that depicts the jobs in a
scheduler, together with their relationships.

    scheduler.export_as_dotfile("foo.dot")
    import os
    os.system("dot -Tpng -o foo.png foo.dot")

You will need to install `graphviz` so that you can use the `dot`
program in this fragment.

# Verbosity

You can also enable more verbosity in any of the following classes.

### `SshNode`

Setting `verbose=True` on an instance of `SshNode` results in messages
being printed about ssh connections and sessions being open and
closed. The scripts in the tutorial implement a `-v` option that does
just that, it is really useful especially for beginners.

If you do not set this, failures to create ssh connections go unnoticed.

Implementation note: this flag is in actuality passed to the
underlying *formatter* object.

### `SshJob`

Setting `verbose=True` on a `SshJob` instance results in all its
commands being run in verbose mode.

### `Run` and other commands

* `Run` : in verbose mode, shows the command that is run, and its return code once it's done
* `RunScript` and `RunScript` : in verbose mode, remote script is run using `bash -x`; expect a lot of output here
* `Push` and `Pull` : print actual arguments to the SFTP get and put

### `Scheduler`

Finally you can set `verbose=True` on a `Scheduler` object, which will
give you details of the jobs being started, and their are done.

</div>


<!-- ------- HANGING ------------>
<div id="HANGING" class="tab-pane fade" markdown="1">

Sometimes a scheduler may exhibit the symptom of not completing as you expect it
to, and it may be a little hard to understand which job is causing the issue.

There are several tricks that can come in handy in this sort of situations:

### Making the scheduler verbose

If you create your Scheduler instance with the `verbose` attribute set to True
(this can be safely done manually late on), then while running it will
issue debug-level statements like these:

    12:32:55.397 3D + 2R + 1I = 6 DONE    : 5 ⚠ ☉ ☓   <SshJob ...
    12:32:55.398 3D + 2R + 1I = 6 STARTING: 6 ⚠   ⚐   <SshJob ...

That should be interpreted as follows:

* at that time (12:32:55) the running scheduler has
  * 3 done jobs
  * 2 running jobs
  * 1 idle job
  * which amounts to a total of 6 jobs
* at that moment, job #5 has just completed,
* and as a result, a millisecond later, job #6 has been started

### Interrupting the Scheduler

Another simple trick is to replace a simple call to `scheduler.Run()` by the
following idiom:

    try:
        success = scheduler.run()
    except KeyboardInterrupt:
        print("OOPS ! ")
        scheduler.debrief()
        exit(1)

This way when the execution hangs, you can interrupt it by typing `Ctrl-C`, which will dump the status of the various jobs, like e.g.:

    ^COOPS - current status
    ----- FINE
    1 ⚠ ☉ ☓   <SshJob `rhubarbe leases --check`> OK
    2 ⚠ ☉ ↺   <SshJob `RunScript: cefore.sh run-cefore-sim`> OK requires={1}
    3 ⚠ ☉ ☓   <SshJob `RunScript: cefore.sh run-cefore-publisher`> OK requires={1}
    4 ⚠ ☉ ☓   <PrintJob `settling for 15 seconds`> [[ -> None]] requires={1}
    5 ⚠ ☉ ☓   <SshJob `cd NS3/sourc ...`> OK requires={4}
    6 ⚠ ☉ ☓   <SshJob `Pull: remote path /root/NS3/source/ns-3-dce/files-2/tmp/OutFile into .`> OK requires={5}

where you can see that job #2 is still running.

### Using the Service class

Very often, when an SshJob does not complete as you expect it to, it is because
it starts background processes that do not properly daemonize.

When the remote process still has an open std channel (in, out or err) open, the
session will cowardly refuse to hang up in the fear to lose such information.

In order to ease the management of such service-oriented activities, the `apssh`
library comes with a `Service` class, that leverages the now general
availability of `systemd` on all the major linux distributions, as an attempt to provide easier and more robust path.

Please see [the Service class
documentation](https://apssh.readthedocs.io/en/latest/API.html?highlight=service#module-apssh.service)
for more details.

</div>

</div> <!-- end div contents -->

</div> <!-- end div container -->
