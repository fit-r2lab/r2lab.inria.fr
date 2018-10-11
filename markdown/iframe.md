title: R2lab
skip_menu: yes
skip_header: yes
skip_title: yes
skip_footer: yes

<div id="livemap_container"></div>

<script src="/assets/r2lab/livemap.js"></script>
<style> @import url("/assets/r2lab/livemap.css"); </style>

<script>
    let ratio = 2/3;
    Object.assign(livemap_options, {
        ratio : ratio,
        // if we do set values from options in addition
        // to a ratio, the actual value is multiplied
        // by the ratio; here setting 6 means actually 4
        // (we need some space for the wall depth)
        margin_x : 6,
        margin_y : 6,
   });

</script>
