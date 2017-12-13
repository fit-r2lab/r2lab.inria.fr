title: Tools
tab: platform
---

Our offering in terms of software tools relies on 2 separate components :

* `nepi-ng` focuses on experiment orchestration that runs on your
  laptop ; it allows you to describe the sequencing and dependencies
  of the various steps of your experiment, including if desired for
  loading images on the nodes when you start from scratch ;

* `rhubarbe` is a low-level tool that is available on the R2lab
  gateway, that helps inspect and change the node status (think: on or
  off) and to load and restore images on the nodes.

You can find a hands-on tutorial and introduction to both tools in
[the tutorials section](/tutorial.md).

### `nepi-ng` : Network Experiment Programming Interface new generation

`nepi-ng` is a Python-based library to model and run network
experiments on a variety of network evaluation testbeds. It allows to
specify resources to use in an experiment, to define experiment
workflow constraints and to automate deployment, resource control and
result collection.

It only assumes `ssh` connectivity to the nodes to be controlled, so
it is not specific to R2lab, and can be used in a variety of contexts;
in particular it ensures optimal usage of ssh connections.

It is available through a CreateCommon license CC BY-NC-ND.

`nepi-ng` is in fact the addition of 2 python libraries named
`asynciojobs` and `apssh`. You can find more details on their API and
internals at the `nepi-ng`'s [entry-point
website](https://nepi-ng.inria.fr).

### `rhubarbe` : a tool for low-level management of nodes

Less sophisticated, but still quite useful on a daily basis,
`rhubarbe` is a R2lab-specific tool for doing quick nodes management
from the command line on the gateway. It can also be invoked through
`nepi-ng` as part of your automated experiment, typically in order to
check that you have a valid lease at this time, load images, wait for
the nodes to show up, or switch off the testbed when you leave (but
don't worry if you forget, it's taken care of).

More details on `rhubarbe` can be found [on its github
repository](https://github.com/parmentelat/rhubarbe).


