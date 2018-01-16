title: R2lab Notebooks
tab: tutorial
skip_header: True

<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/3.2.0/diff.min.js"></script>
<script src="/assets/r2lab/open-tab.js"></script>
<script src="/assets/r2lab/r2lab-diff.js"></script>
<style>@import url("/assets/r2lab/r2lab-diff.css")</style>


<ul class="nav nav-tabs">
  <li class="active"> <a href="#JUPYTER">Intro</a> </li>
  <li> <a href="#RADIOMAP">Radiomap</a> </li>

<< include r2lab/tutos-index.html >>
</ul>


<div id="contents" class="tab-content" markdown="1">

<!------------ JUPYTER ------------>
<div id="JUPYTER" class="tab-pane fade in active" markdown="1">

### Jupyter notebooks for reproducible research

We are convinced that the general approach of writing Jupyter
notebooks is an effective means to improve research
reproducibility.

In this section we give some links to runnable notebooks, with the
hope to foster this medium as a common practice.

### Hosting at mybinder

A notebook requires a so-called "kernel", typically a python interpreter, and thus computing resources.

There are several options for running such a document :

* install jupyter locally and run the notebook from your computer;
  this also implies that you install all the dependencies for that
  experiment,

* or run the notebook from a dedicated infrastructure; `mybinder.org`
  is one such infrastructure that lets us easily expose such dedicated
  notebook services from just a github repository.

### Hosted notebooks, ssh keys and authentication

These two approaches have their obvious pros and cons.

The hosted approach allows for instant gratification, but on the other
hand has more limitations, and in the case of R2lab in particular, it
will not let you actually log into the testbed, because the docker
container that runs behind your mybinder notebook has no knowledge of
your ssh credentials.

So going for a local installation is a little more tedious, but offers
more capabilities.


</div>

<!------------ RADIOMAP ------------>
<div id="RADIOMAP" class="tab-pane fade" markdown="1">

### Building a radiomap

Our first example of a runnable notebook does not address a research
theme exactly, but hopes to serve as a methodological guidelines on a
representative subject. Our pretext here is to gather
calibration-oriented data, i.e. perceived power at node (a) when node
(b) is emitting, for all couples of nodes.

You can find the source for this notebook:

* [under github in the r2lab-demos area](https://parmentelat/r2lab-demos/radiomap).  This repo
  contains all the needed code to collect your own data; because of the
  limitations exposed above, the repository also contains some
  gathered data, so that visualization can be done right away from mybinder as well


* in mybinder here :
  <a href="https://mybinder.org/v2/gh/parmentelat/r2lab-demos/master?filepath=radiomap%2Fradiomap.ipynb" target='_'>
  radiomap <img src="https://mybinder.org/badge.svg">
  </a>

</div> 

</div> <!-- end div contents -->
