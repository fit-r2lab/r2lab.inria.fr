title: G5K - FIT summer school
tab: tutorial
skip_header: yes



# colored map

<div id="livemap_container"></div>
<script type="text/javascript" src="/assets/r2lab/livemap.js"></script>
<style type="text/css"> @import url("/assets/r2lab/livemap.css"); </style>
<script>
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
      group_colors : [
/*
    "rgba(61, 90, 128, 0.5)",
    "rgba(152, 193, 217, 0.5)",
    "rgba(224, 251, 252, 0.5)",
    "rgba(238, 108, 77, 0.5)",
    "rgba(41, 50, 65, 0.5)",
    "rgba(41, 50, 65, 0.5)",
*/
    "#FF1F2080",
    "#00E0DF80",
    "#616F6F80",
    "#FF5FC080",
    "#0000A380",
    "#00A40080",
    "#FFBA3F80",
],

//    debug : true,
   });
</script>
