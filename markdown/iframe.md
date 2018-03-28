title: R2lab
skip_menu: yes
skip_header: yes
skip_title: yes
skip_footer: yes

<div id="livemap_container"></div>

<script type="text/javascript" src="/assets/r2lab/livemap.js"></script>
<style type="text/css"> @import url("/assets/r2lab/livemap.css"); </style>

<script>
    let ratio = 2/3;
    Object.assign(livemap_options, {
      space_x : 80 * ratio,
      space_y : 80 * ratio,
      radius_unavailable : 21 * ratio,
      radius_ok : 16 * ratio,
      radius_pinging : 10 * ratio,
      radius_warming : 4 * ratio,
      radius_ko : 0 * ratio,
      margin_x : 20,
      margin_y : 20,
      padding_x : 35 * ratio,
      padding_y : 35 * ratio,
      pillar_radius : 16*ratio,

      font_size: 16 * ratio,
      phone_size: 20 * ratio,
   });

</script>
