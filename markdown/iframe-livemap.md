title: R2lab
skip_menu: yes
skip_header: yes
skip_title: yes
skip_footer: yes

<div id="livemap_container"></div>

<script type="module">
    import {livemap_options} from "/assets/r2lab/livemap.js";
    let ratio = 3/4;
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
