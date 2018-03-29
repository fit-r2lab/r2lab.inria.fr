title: G5K - FIT summer school
tab: tutorial
skip_header: yes

# reservations - accounts - ssh keys

* testbed is normally designed to be reserved **as a whole**

  * so we will use a single slice named `inria_school`

* register for an account at <https://r2labapi.inria.fr/db/persons/register.php>

  * make sure to choose site `inria`

* once this is OK, log into <https://r2lab.inria.fr/run.md> and

  * upload your ssh key (click the *slices and keys* area)
  * and check that you see the `inria_school` slice in the area marked `drag & drop to book`
  * otherwise [send an e-mail](mailto:thierry.parmentelat@inria.fr) requesting to be made part of that slice
  * log out and back in if necessary, until you can see that slice show up


![website](raw/screenshots/school.png)


# rain check

Using your ssh key, you should be able to enter the testbed gateway:

```
ssh inria_school@faraday.inria.fr
```

*****
*****
The groups below will be defined on the spot
*****
*****

# colored map

We need to split the nodes in several groups to implement some kind of light isolation.

<div id="livemap_container"></div>

<div id="colortable_container"></div>

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
        "#616F6F80",
        "#FF5FC080",
        "#0000A380",
        "#00A40080",
        "#FFBA3F80",
    ];

    // let colormap = new ColorMap(37).handpick(colors, groups6);
    let colormap = new ColorMap(37).cyclic(colors, 7);

    // override livemap default settings
    Object.assign(livemap_options, {
      space_x : 72,
      space_y : 87,
      radius_unavailable : 21,
      radius_ok : 16,
      radius_pinging : 10,
      radius_warming : 4,
      radius_ko : 0,
      margin_x : 5,
      margin_y : 20,
      padding_x : 35,
      padding_y : 35,
      colormap : colormap,

//    debug : true,
   });

   $(function() { colormap.colortable(); });

</script>
