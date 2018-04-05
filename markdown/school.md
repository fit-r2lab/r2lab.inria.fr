title: G5K - FIT summer school
tab: news
skip_header: yes

[TOC]

# 1. Where to find resources

## slides

Check out

* our demos github repo <https://github.com/fit-r2lab/r2lab-demos>
* and [specifically in the school subdir](https://github.com/fit-r2lab/r2lab-demos/tree/master/school)


## tutorials

Also remember to use the R2lab website <https://r2lab.inria.fr>

* in particular an extensive set of tutorials on [the TUTOS page](/tutorial.md)
* in everyday life the most useful page is [the RUN page](/run.md)

*****

# 2. Reservations - accounts - ssh keys

## how to get an account

* register for an account

  * fill the form at <https://r2labapi.inria.fr/db/persons/register.php>
  * make sure to choose site `inria`
  * also please make sure to use an institutional email address (e.g. avoid gmail.com)
  * expect a first confirmation e-mail and click on the link

* someone will validate your application

* once this is OK, log into <https://r2lab.inria.fr/run.md> and

  * upload your ssh key (click the *slices and keys* area)
  * and check that you see the `inria_school` slice in the area marked `drag & drop to book`
  * otherwise [send an e-mail](mailto:thierry.parmentelat@inria.fr) requesting to be made part of that slice
  * log out and back in if necessary, until you can see that slice show up

![website](raw/screenshots/school.png)

## we will all use `inria_school`

* testbed is normally designed to be reserved **as a whole**

  * so we will use a single slice named `inria_school`

## rain check

Using your ssh key, you should be able to enter the testbed gateway:

```
ssh inria_school@faraday.inria.fr
```

*****

# 3. Notes on using notebooks or IPython

## notebooks *vs* regular python

We will use notebooks during the hands-on sessions, because this format allows
for interactive python coding, together with online graphs, and nice layouts.

This is ** not at all mandatory**,
please use your usual python environment if you feel more comfortable with that.

IPython is a quite decent alternative, again pick what you are most
comfortable with, today's topic is the testbed and related tools,
not your python environment.

## jupyter classic *vs* jupyter lab

We will use jupyter classic, primarily because the RISE nbextension (that allows
to turn a notebook into a slideshow) is not yet supported under jupyterlab.

We are also aware of some other limitations currently present under jupyterlab, so
unless you know what you're doing it's probably best to stick with the classic
notebook.

## **Important** note about tornado v5

**Important** note if you plan on using notebooks.

With the recent rollout of tornado-5, as of end of march 2018, it is
currently **not possible** to run anything relying on an `asyncio`
event loop from a notebook **if you have tornado v5** installed.

### checking

    pip3 freeze | grep tornado

### fixing

if the above command shows you a version *5.x*, then you can work around the problem by issuing

    pip3 install tornado==4.5.3

and then restart your python kernel.

For more details on this issue, see <https://github.com/jupyter/notebook/issues/3397>

## inserting livemap in a notebook

Copy this code in a cell

    from IPython.display import IFrame
    IFrame('https://r2lab.inria.fr/iframe.md', height=380, width='100%')


# Known issues

## livemap not animated

Some pages in the website, like primarily [the RUN page](/run.md) show a
live status of the testbed.
During the first session, some participants could not see this animation,
for them the testbed remains blank.

This is due to the live traffic about the testbed being broadcast
through socketio on port 999, that apparently is filtered for some participants.

This is not critical for the tutorial session, so unless you can work around
the filtering by enabling a VPN or swapping to another network, just live with that :)


## python3 and pip3

Some people also ran into trouble for installing `apssh` through pip3.

### checking

    $ type python3
    python3 is /usr/local/bin/python3
    $ type pip3
    pip3 is /usr/local/bin/pip3


If the 2 commands point at different locations, then chances are that `pip3`
is installing stuff for some other python3 that the one that you are using.

If everything goes well you should see this:

    $ python3 -c 'import apssh; print(apssh.__version__)'
    0.9.4




*****
*****
*****
*****
*****
*****

This section probably won't be useful.

Node groups

This is needed because we all share the same slice.

**Note.** The actual group nodes will be defined on the spot

colored map

We need to split the nodes in several groups to implement some kind of light isolation.

<div class="container">
<div class="row">
<div class="col-md-7" id="livemap_container"></div>
<div class="col-md-5" id="colortable_container"></div>
</div>
</div>

<script type="text/javascript" src="/assets/r2lab/livemap.js"></script>
<style type="text/css"> @import url("/assets/r2lab/livemap.css"); </style>
<script type="text/javascript" src="/assets/r2lab/colormap.js"></script>
<style type="text/css"> @import url("/assets/r2lab/colormap.css"); </style>
<script>

    let groups5 = [
        [1,  7, 13, 19, 27, 33, 35, 37],
        [2,  9, 11, 18, 23, 28 ,36],
        [3, 10, 12, 16, 21, 29, 31],
        [4,  6, 14, 20, 25, 26, 34],
        [5, 8, 15, 17, 22, 24 ,30, 32],
    ];

    let groups6 = [
        [1, 7, 15, 22, 29, 35],
        [2, 8, 14, 16, 24, 26, 33],
        [3, 9, 13, 20, 28, 37],
        [4, 10, 12, 21, 27, 34],
        [5, 11, 17, 23, 25, 32],
        [6, 18, 19, 30, 31, 36],
    ];

    let colors = [
        "#FF1F2080",
        "#00E0DF80",
        "#FF5FC080",
        "#3030A380",
        "#00A40080",
        "#FFBA3F80",
        "#616F6F80",
        "rgba(171, 152, 149, .5)",
        "rgba(83, 45, 59, .5)",
        "rgba(205, 102, 146, .5)",
        "rgba(247, 202, 201, .5)",
        "rgba(164, 158, 157, .5)",
    ];

    // let colormap = new ColorMap(37).handpick(colors, groups6);
    let colormap = new ColorMap(37).cyclic(colors, 12);

    let ratio = .72;

    // override livemap default settings
    Object.assign(livemap_options, {
        ratio : ratio,
        margin_x : 10/ratio,
        margin_y : 10/ratio,
        colormap : colormap,

//    debug : true,
   });

   $(function() { colormap.colortable(); });

</script>
