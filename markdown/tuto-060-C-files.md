title: nepi-ng - C - managing files
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>

<ul class="nav nav-tabs nav-fill" role="tablist">
  <li class="nav-item">
   <a class="nav-link active" href="#INTRO">INTRO</a> </li>
  <li class="nav-item">
   <a class="nav-link" href="#C1">C1</a> </li>
  <li class="nav-item">
   <a class="nav-link" href="#C2">C2</a></li>
  <li class="nav-item">
   <a class="nav-link" href="#C3">C3</a></li>
   <li class="nav-item">
    <a class="nav-link" href="#C3bis">C3bis</a></li>
  <li class="nav-item">
    <a class="nav-link" href="#WRAPUP">WRAP UP</a></li>

  << include r2lab/tutos-index.html >>
</ul>


<div id="contents" class="tab-content" markdown="1">

<!------------ INTRO ------------>
<div id="INTRO" class="tab-pane fade show active" markdown="1">

### Scenario

In this series, we will see how to transfer files between hosts, using
the `Push` and `Pull` commands in a `SshNode`.

<br/>
The version in C3 will perform the following:

* generate a random file locally, and transfer it using SFTP onto fit01
* transfer it from fit01 to fit02 over the data network using netcat
* finally retrieve it locally from fit02 using SFTP again,
  and compare the result to make sure the file is intact.

The progression from C1 to C3 matches these bullets : C1 just
performs the first bullet, and C2 performs the first two bullets.

The last scenario, labelled C3bis, is a variant around C2. It is not
crucial to see it when first reading this tutorial.  In this scenario,
we perform the exact same scenario as in C2, but we see a recipe to
start and stop a process in sync with the jobs in a scheduler.


### New features

We will meet the `LocalNode` object that will let use run local
commands just like on remote nodes.

We will also take this chance to see that a `SshJob` object can be
defined with **several commands**, which can be helpful to avoid the
need to create long strings of jobs.

We also introduce the `Sequence` object, that is a convenience tool
for creating, well obviously, sequences of jobs, without the hassle of
managing the `required` relationship for each job.

Finally throughtout this series, we will also illustrate another
possible way to manage the components of the scheduler: instead of
creating the scheduler at the end with all the jobs, we create the
scheduler at the very beginning and create the jobs **right into the
scheduler**. Of course the result is exactly the same, it's just
another programming style that is probably worth considering.

Let us start with [copying files over to the
node](javascript:open_tab('C1')) with the `Push` command object.

</div>

<!------------ C1 ------------>
<div id="C1" class="tab-pane fade" markdown="1">

### Objective

We start over from scratch here, and to begin with, we want to

* locally generate a random file,
* and push it over to node fit01

<center> <img src="/assets/img/C1.png" alt="c1" height="240px"></center>

This is what the code below carries out; the things to outline in this code are

* we see for the first time **the `LocalNode` object**, that can be used
  almost exactly as a `SshNode` object - except that it is of course
  simpler to build;

* once the local file is created, we use **a `Push` instance** instead of
  the `Run` and its variants that we have seen so far, to actually
  copy local files on the remote node;

* also note that inside a single `SshJob` instance, it is possible to
  provide an (ordered) **list of commands** to run on that node, mixing
  commands and file transfers as needed; this is how we can both push
  the `RANDOM` file over to node1, and display its size and SHA1 sum,
  using a single instance of `SshJob`.

### The code

<< codeview C1 C1-files.py graph=C1.png >>

### Sample output

<< togglableoutput C1out C1.out "$ python3 C1-files.py" >>

### Next

In [the next section](javascript:open_tab('C2')) we will extend this
scenario, and push the RANDOM file on another node using the wired network.

</div>

<!------------ C2 ------------>
<div id="C2" class="tab-pane fade" markdown="1">

### Objective

We extend the C1 scenario and push the RANDOM file from fit01 to fit02 over the wired network.

<center> <img src="/assets/img/C2.png" alt="c2" height="240px"></center>

So we reuse the `turn-on-data` commands, that we had seen in the B
series already, to enable the `data` interface.

### File transfer per se

In order to transfer the file from fit01 to fit02: of course we could
have used simple tools like plain `scp`. Our goal however here is more
to show how to orchestrate such transfers in an environment closer to
typical experimental conditions.

So in this first variant, we will use `netcat`;  we start with running
a server instance of netcat on the receiving end (in our case
`fit02`), then run a client netcat on the sender side (here `fit01`).

In terms of synchronization, note how we

* start the server side in background (with a `&`); the corresponding
  job hence returns immediately;

* which lets us start the client side
  almost immediately afterwards (well, we add a 1s delay to stay on
  the safe side)

* and luckily enough, the server-side server will terminate as soon as
  the client side netcat is done; so we essentially do not need to
  worry about stopping the server, it stops itself at the exact right
  time

* so once the sender client is done, we can proceed and display the
  received file on fit02.

The purpose of the C3bis script is to show how one can use shell
tricks to deal with less fortunate situations, where typically the
server side runs forever, but you need to stop it once some other job
is done.

### The `Sequence` object

Note the use of the `Sequence` object in variable `transfer_job`, that
almost entirely relieves us of managing the `required` relationships.

All the jobs inserted in the `Sequence` have their `required`
relationship set to the previous job in the list, by setting
`required` on the `Sequence` object we actually deal with the
`required` jobs for the first job in the sequence.

Finally, by setting `scheduler` on this `transfer_job` object, we
automatically attach all the jobs in the sequence to the global
scheduler.

### The code

<< codeview C2 C2-files.py previous=C1-files.py graph=C2.png>>

### Sample output

<< togglableoutput C2out C2.out "$ python3 C2-files.py" >>

### Next

In [the next section](javascript:open_tab('C3')) we will see
how to retrieve back that same file in order to close the loop.

</div>

<!------------ C3 ------------>
<div id="C3" class="tab-pane fade" markdown="1">

### Objective

In this scenario, we extend again C2 to close the loop, and retrieve
our random file back on the local laptop.

<center> <img src="/assets/img/C3.png" alt="c3" height="240px"></center>

### The `Pull` object

The only new thing here is the use of a `Pull` object, which like for
the `Push` object, can be used in a list of commands to run on a given
node as part of a `SshJob`.

### The code

<< codeview C3 C3-files.py previous=C2-files.py graph=C3.png>>

### Sample output

<< togglableoutput C3out C3.out "$ python3 C3-files.py" >>

### Next

If this is your first reading, we suggest you skip
[C3bis](javascript:open_tab('C3bis')) and [go directly to
WRAPUP](javascript:open_tab('WRAPUP')) for a conclusion on this
series.

</div>

<!------------ C3bis ------------>
<div id="C3bis" class="tab-pane fade" markdown="1">

### Objective

In this particular scenario, we restart from C2.

Remember C2 is about transferring a file from node 1 to node 2 over
the data network, thanks to `netcat`. As we had seen at the time, it
is rather fortunate that `netcat` in server mode returns as soon as
its (single) client terminates.

There are a lot of cases though, where things are not that simple, and
where there is a need to manually terminate / cleanup dangling processes
that are no longer useful.

<br/>

Sometimes, it is only a matter of starting and stopping packaged
services like apache or similar, and in this case all we need to do is
to call things like e.g. `systemctl start apache2` and `systemctl stop
apache2`.

<br/>

In the code below, we will see a technique that can be used to start
and stop, and even monitor, a custom process. This is in
`receiver_manager_script`, a small shell script that knows how to
start, stop, and even monitor, a single-process service.

### The code

You can still see the difference with `C2-files.py`, but let us start with the plain code for `C3bis-files.py`

<< codeview C3bis C3bis-files.py previous=C2-files.py selected=plain graph=C3bis.png>>

### Sample output

<< togglableoutput C3bisout C3bis.out "$ python3 C3bis-files.py" >>

### Next
We can now [conclude this section](javascript:open_tab('WRAPUP'))

</div>

<!------------ WRAPUP ------------>
<div id="WRAPUP" class="tab-pane fade" markdown="1">

In this C series , we have seen:

* how to use the `Push` and `Pull` commands to copy files back and
  forth on and from nodes;

* how to use the `LocalNode` to augment our scripts with commands run
  locally;

* how a single `SshJob` can trigger several commands, mixing `Run`,
  `RunString`, `Push` and `Pull` types of commands;

* how to implement (in C3bis) a rustic service management feature, for
  housekeeping purposes;

* and finally, still in C3bis, how to produce a graphical view of a
  `Scheduler` for documentation and/or troubleshooting.

In [the next tutorial](/tuto-070-D-prep.md) we will see how to simply provide a
command-line option for loading images on nodes.

</div>

</div> <!-- end div contents -->
