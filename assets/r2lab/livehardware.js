// -*- js-indent-level:4 -*-

/* for eslint */
/*global $ */

"use strict";

import {load_css} from "/assets/r2lab/load-css.js";
load_css("/assets/r2lab/livehardware.css");

import {LiveColumnsNode, LiveColumns, livecolumns_options, span_html} from '/assets/r2lab/livecolumns.js' ;

//global - mostly for debugging and convenience
let the_livehardware;

//////////////////////////////
// nodes are dynamic
// their hardware row and cells get created through d3 enter mechanism
class LiveHardwareNode extends LiveColumnsNode{

    constructor(id) {
        super(id);
        this.cells_data = [
            [ span_html(id, 'badge pointer'), '' ],     // id
            undefined,                             // avail
            undefined,                             // on/off
            undefined,                             // usrp-on-off
            undefined,                             // duplexer
            undefined,                             // images
        ];
    }

    // nodes worth being followed when clicking on the hardware banner
    is_worth() {
        return (   (this.usrp_type || 'none') != 'none');
    }

    // after the internal properties are updated from the incoming JSON message
    // we need to rewrite actual representation in cells_data
    // that will contain a list of ( html_text, class )
    // used by the d3 mechanism to update the <td> elements in the row
    compute_cells_data() {
        let col = 1
        // avail
        this.cells_data[col++] = this.cell_available();
        // on-off
        this.cells_data[col++] = this.cell_on_off();
        // usrp-on-off
        this.cells_data[col++] = this.cell_sdr(false);
        // duplexer details
        this.cells_data[col++] = this.cell_duplexer();
        // usrp antenna(s) images
        this.cells_data[col++] = this.cell_images();
    }

    cell_duplexer() {
        let html = (! ('usrp_duplexer' in this)) ? '-' : this.usrp_duplexer;
        return [ html, "" ];
    }

    // images are found under node-images
    // i.e. r2lab.inria.fr-raw/node-images
    image_link(path) {
        let icon = span_html('', 'fa fa-camera');
        let url = `/raw/node-images/${path}`;
        let tooltip_text = `click to enlarge<br/>${path}<br/><img src='${url}' width='200'/>`;
        let link = `<a class="image-link" alt="click to see image"`
                 + ` href="${url}" target="_blank">${icon}</a>`;
        return `<span data-toggle="tooltip" `
             + `data-position="top" data-html="true" data-delay="100"`
             + `title="${tooltip_text}" data-placement=bottom>`
             + `${link}`
             + `</span>`;
         }

    cell_images() {
        if ((!('images' in this)) || (this.images.length == 0)) {
            return '-';
        }
        let html = this.images.map(
            path => this.image_link(path)
        ).join(" / ");
        return [html, "image-links"]
    }

    cell_wifi_antennas() {
        if ((!('images_wifi' in this)) || (this.images_wifi.length == 0)) {
            return '-';
        }
        let html = this.images_wifi.map(this.image_link)
                  .join(" / ");
        return [html, "image-links"]
    }

}


//////////////////////////////
class LiveHardware extends LiveColumns {

    constructor(domid) {
        super();
        this.domid = domid;
    }

    init_headers(header) {
        header.append('th').html('node');
        header.append('th').html('avail.');
        header.append('th').html('on/off');
        header.append('th').html('sdr');
        header.append('th').html('duplexer');
        header.append('th').html('images');
    }

    init_nodes() {
        for (let i=0; i < livecolumns_options.nb_nodes; i++) {
            this.nodes[i] = new LiveHardwareNode(i+1);
        }
    }
}

// autoload
$(function() {
    // name it for debugging from the console
    the_livehardware = new LiveHardware("livehardware_container");
    the_livehardware.init();
})
