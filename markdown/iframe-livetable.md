title: R2lab livetable
skip_menu: yes
skip_header: yes
skip_title: yes
skip_footer: yes

<div id="livetable_container"></div>

<script type="module">
    import {livetable_options} from "/assets/r2lab/livetable.js";
    let ratio = 2/3;
    Object.assign(livetable_options, {
        ratio : ratio,
        // if we do set values from options in addition
        // to a ratio, the actual value is multiplied
        // by the ratio; here setting 6 means actually 4
        // (we need some space for the wall depth)
        margin_x : 6,
        margin_y : 6,
   });

</script>
