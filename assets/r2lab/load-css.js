export function load_css(url) {
    // I'd have expected jQuery to come with this, but apparently no..
    $(function() {
        $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            href: url
        }).appendTo("head");
    })
}
