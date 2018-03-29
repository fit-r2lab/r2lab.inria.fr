title: G5K - FIT summer school
tab: tutorial
skip_header: yes

# 1. Reservations - accounts - ssh keys

## we will all use `inria_school`

* testbed is normally designed to be reserved **as a whole**

  * so we will use a single slice named `inria_school`

## how to get an account

* register for an account at <https://r2labapi.inria.fr/db/persons/register.php>

  * make sure to choose site `inria`

* once this is OK, log into <https://r2lab.inria.fr/run.md> and

  * upload your ssh key (click the *slices and keys* area)
  * and check that you see the `inria_school` slice in the area marked `drag & drop to book`
  * otherwise [send an e-mail](mailto:thierry.parmentelat@inria.fr) requesting to be made part of that slice
  * log out and back in if necessary, until you can see that slice show up


![website](raw/screenshots/school.png)


## rain check

Using your ssh key, you should be able to enter the testbed gateway:

```
ssh inria_school@faraday.inria.fr
```

*****

# 2. Note on using notebooks

**Important** note if you plan on using notebooks.

With the recent rollout of tornado-5, as of end of march 2018, it is
currently **not possible** to run anything relying on an `asyncio`
event loop from a notebook if you have tornado v5 installed.

### checking

    pip3 freeze | grep tornado

### fixing

if the above command shows you a version *5.x*, then you can work around the problem by issuing

    pip3 install tornado==4.5.3

and then restart your python kernel.

For more details on this issue, see <https://github.com/jupyter/notebook/issues/3397>

### inserting livemap in a notebook

    from IPython.display import IFrame
    IFrame('https://r2lab.inria.fr/iframe.md', height=380, width='100%')


*****

# 3. Node groups

This is needed because we all share the same slice.

**Note.** The actual group nodes will be defined on the spot

### colored map

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
    ];

    // let colormap = new ColorMap(37).handpick(colors, groups6);
    let colormap = new ColorMap(37).cyclic(colors, 7);

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
