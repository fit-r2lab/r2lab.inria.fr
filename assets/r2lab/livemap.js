/* for eslint */
/*global $ d3 */

"use strict";

import {load_css} from "/assets/r2lab/load-css.js";
load_css("/assets/r2lab/livemap.css");

import {Sidecar} from "/assets/r2lab/sidecar.js";

// re-configurable from the markdown
export let livemap_options = {

    // just set this if you need scaling
    ratio : 1.,
    // don't touch this one
    _scaled: false,

    // the space around the walls in the canvas
    margin_x : 50, margin_y : 50,
    // distance between nodes
    space_x : 80, space_y : 80,
    // distance between nodes and walls
    padding_x : 40, padding_y : 40,
    // pillars - derived from the walls
    pillar_radius : 16,
    // size for rendering nodes status
    radius_unavailable : 18,
    radius_ok : 18,
    radius_pinging : 12,
    radius_warming : 6,
    radius_ko : 0,

    font_size : 16,
    phone_size : 20,

    // usrp thingy
    // full size for the usrp-icon; this is arbitrary but has the right width/height ratio
    usrp_width : 13,
    usrp_height : 23,
    // on and off units get rendered each at their size
    usrp_on_ratio : .90,
    usrp_off_ratio : .70,
    // how much we move from the north-east intersection
    // with node radius circle
    usrp_delta_x : 2,
    usrp_delta_y : 3,


    // see http://stackoverflow.com/questions/14984007/how-do-i-include-a-font-awesome-icon-in-my-svg
    // and http://stackoverflow.com/questions/12882885/how-to-add-nbsp-using-d3-js-selection-text-method/12883617#12883617
    // parmentelat ~/git/Font-Awesome/less $ grep 'fa-var-plane' variables.less
    // @fa-var-plane: "\f072";
    icon_plane_content : "\uf072",
    icon_phone_content : "\uf095",
    icon_question_content : "\uf128",

    icon_sidecar_ok : "\uf14a",
    icon_sidecar_ko : "\uf057",

    // override this with a ColorMap object if desired
    colormap : null,

    debug : false,

}

function livemap_debug(...args) {
    if (livemap_options.debug)
        console.log(`${new Date()}`,...args);
}


function scale_options() {
    if (livemap_options._scaled)
        return;
    let ratio = livemap_options.ratio;
    livemap_options.margin_x *= ratio;
    livemap_options.margin_y *= ratio;
    livemap_options.space_x *= ratio;
    livemap_options.space_y *= ratio;
    livemap_options.padding_x *= ratio;
    livemap_options.padding_y *= ratio;
    livemap_options.pillar_radius *= ratio,
    livemap_options.radius_unavailable *= ratio,
    livemap_options.radius_ok *= ratio,
    livemap_options.radius_pinging *= ratio,
    livemap_options.radius_warming *= ratio,
    livemap_options.radius_ko *= ratio,

    livemap_options.font_size *= ratio,
    livemap_options.phone_size  *= ratio,

    livemap_options._scaled = true;
}

////////// status details
// fields that this widget knows about concerning each node
// * available: missing, or 'ok' : node is expected to be usable; if 'ko' a very visible red circle shows up
// * cmc_on_off: 'on' or 'off' - nodes that fail will be treated as 'ko', better use 'available' instead
// * control_ping: 'on' or 'off'
// * control_ssh: 'on' or 'off'
// * os_release: fedora* ubuntu* with/without gnuradio, .... or 'other'

let livemap_geometry = {

    ////////// nodes positions - originally output from livemap-prep.py
    mapnode_specs : [
        { id: 1, i:0, j:4 },
        { id: 2, i:0, j:3 },
        { id: 3, i:0, j:2 },
        { id: 4, i:0, j:1 },
        { id: 5, i:0, j:0 },
        { id: 6, i:1, j:4 },
        { id: 7, i:1, j:3 },
        { id: 8, i:1, j:2 },
        { id: 9, i:1, j:1 },
        { id: 10, i:1, j:0 },
        { id: 11, i:2, j:4 },
        { id: 12, i:2, j:3 },
        { id: 13, i:2, j:2 },
        { id: 14, i:2, j:1 },
        { id: 15, i:2, j:0 },
        { id: 16, i:3, j:4 },
        { id: 17, i:3, j:2 },
        { id: 18, i:3, j:1 },
        { id: 19, i:4, j:4 },
        { id: 20, i:4, j:3 },
        { id: 21, i:4, j:2 },
        { id: 22, i:4, j:1 },
        { id: 23, i:5, j:4 },
        { id: 24, i:5, j:2 },
        { id: 25, i:5, j:1 },
        { id: 26, i:6, j:4 },
        { id: 27, i:6, j:3 },
        { id: 28, i:6, j:2 },
        { id: 29, i:6, j:1 },
        { id: 30, i:6, j:0 },
        { id: 31, i:7, j:4 },
        { id: 32, i:7, j:3 },
        { id: 33, i:7, j:2 },
        { id: 34, i:7, j:1 },
        { id: 35, i:7, j:0 },
        { id: 36, i:8, j:1 },
        { id: 37, i:8, j:0 },
    ],

    ////////// the  two pillars - this is manual
    pillar_specs : [
        { id: 'left', i:3, j:3 },
        { id: 'right', i:5, j:3 },
    ],

    mapphone_specs : [
        {id : 1, i : 0.5, j : 4.2 },
        {id : 2, i : 8. , j : 0.5 },
    ],

    sidecar_details: {
        i: 8, j: 4, radius: 20,
    },

    //////////////////// configuration
    // total number of rows and columns
    steps_x : 8, steps_y : 4,

    // the overall room size
    // xxx check this actually takes into account options when redefined later on
    room_x : function () {
        return this.steps_x*livemap_options.space_x + 2*livemap_options.padding_x
    },
    room_y : function () {
        return this.steps_y*livemap_options.space_y + 2*livemap_options.padding_y
    },

    // translate i, j into actual coords
    grid_to_canvas : function (i, j) {
        return [ i * livemap_options.space_x
               + livemap_options.margin_x + livemap_options.padding_x,
                (this.steps_y-j) * livemap_options.space_y
               + livemap_options.margin_y + livemap_options.padding_y];
    },

    //////////////////////////////
    // our mental model is y increase to the top, not to the bottom
    // also, using l (relative) instead of L (absolute) is simpler
    // but it keeps roundPathCorners from rounding.js from working fine
    // keep it this way from now, a class would help keep track here
    line_x : x => `l ${x} 0 ` ,
    line_y : y => `l 0 ${-y} `,

    walls_path : function() {
        let path="";
        path += `M ${this.room_x()+livemap_options.margin_x} ${this.room_y()+livemap_options.margin_y} `;
        path += this.line_x(-(7*livemap_options.space_x+2*livemap_options.padding_x));
        path += this.line_y(3*livemap_options.space_y);
        path += this.line_x(-1*livemap_options.space_x);
        path += this.line_y(livemap_options.space_y+2*livemap_options.padding_y);
        path += this.line_x(2*livemap_options.space_x+2*livemap_options.padding_x);
        path += this.line_y(-livemap_options.space_y);
        path += this.line_x(4*livemap_options.space_x-2*livemap_options.padding_x);
        path += this.line_y(livemap_options.space_y);
        path += this.line_x(2*livemap_options.space_x+2*livemap_options.padding_x);
        path += "Z";
        return path;
    },

}

////////////////////////////////////////
// helpers
// locating a record by id in a list
function locate_by_id (list_objs, id) {
    for (let obj of list_objs) {
        if (obj.id == id) {
            return obj;
        }
    }
    console.log(`ERROR: livemap: locate_by_id: id= ${id} was not found`);
}


// obj_info is a dict coming through sidecar
// simply copy the fieds present in this dict in the local object
// for further usage in animate_nodes_changes
function update_obj_from_info(obj, obj_info){
    let modified = false;
    for (let prop in obj_info) {
        if (obj_info[prop] != obj[prop]) {
            obj[prop] = obj_info[prop];
            modified = true;
        }
    }
    return modified;
}

//////////////////////////////
class MapPhone {

    constructor(phone_spec) {
        this.id = phone_spec['id'];
        this.i = phone_spec['i'];
        this.j = phone_spec['j'];
        let coords = livemap_geometry.grid_to_canvas(this.i, this.j);
        this.x = coords[0];
        this.y = coords[1];
    }

    text() {
        if (this.airplane_mode == 'on')
            return livemap_options.icon_plane_content;
        else if (this.airplane_mode == 'off')
            return livemap_options.icon_phone_content;
        else
            return livemap_options.icon_question_content;
    }

}

//////////////////////////////
// nodes are dynamic
// their visual rep. get created through d3 enter mechanism
class MapNode {

    constructor (node_spec) {
        this.id = node_spec['id'];
        // i and j refer to a logical grid
        this.i = node_spec['i'];
        this.j = node_spec['j'];
        // compute actual coordinates
        let coords = livemap_geometry.grid_to_canvas(this.i, this.j);
        this.x = coords[0];
        this.y = coords[1];

        if (livemap_options.colormap) {
            this.group_color = livemap_options.colormap.color(this.id);
        }
    }

    is_available() {
        return this.available != 'ko';
    }

    is_alive() {
        return this.cmc_on_off == 'on'
            && this.control_ping == 'on'
            && this.control_ssh != 'off'
            && this.available != 'ko';
    }

    // shift label south-east a little
    // we cannot just add a constant to the radius
    text_offset(radius) {
        return Math.max(5, 12-radius/2);
    }
    text_x() {
        if ( ! this.is_available()) return this.x;
        let radius = this.node_status_radius();
        let delta = this.text_offset(radius);
        return this.x + ((radius == 0) ? 0 : (radius + delta));
    }

    text_y() {
        if ( ! this.is_available()) return this.y;
        let radius = this.node_status_radius();
        let delta = this.text_offset(radius);
        return this.y + ((radius == 0) ? 0 : (radius + delta));
    }


    ////////// node radius
    // this is how we convey most of the info
    // when turned off, the node's circle vanishes
    // when it's on but does not yet answer ping, a little larger
    // when answers ping, still larger
    // when ssh : full size with OS badge
    // but animate.py does show that
    node_status_radius() {
        // completely off
        if (this.cmc_on_off != 'on')
            return livemap_options.radius_ko;
        // does not even ping
        else if (this.control_ping != 'on')
            return livemap_options.radius_warming;
        // pings but cannot get ssh
        else if (this.control_ssh != 'on')
            return livemap_options.radius_pinging;
        // ssh is answering
        else
            return livemap_options.radius_ok;
    }

    // right now this is visible only for intermediate radius
    // let's show some lightgreen for the 2/3 radius (ssh is up)
    text_color() {
        return '#555';
    }

    // luckily this is not rendered when a filter is at work
    node_status_color() {
        let radius = this.node_status_radius();
        return (radius == livemap_options.radius_pinging) ? d3.rgb('#71edb0').darker() :
            (radius == livemap_options.radius_warming) ? d3.rgb('#f7d8dd').darker() :
            '#bbb';
    }

    // showing an image (or not, if filter is undefined)
    // depending on the OS
    node_status_filter() {
        let filter_name;
        // only set a filter with full-fledged nodes
        if (! this.is_alive())
            return undefined;
        // remember infos might be incomplete
        else if (this.os_release == undefined)
            return undefined;
        else if (this.os_release.indexOf('other') >= 0)
            filter_name = 'other-logo';
        else if (this.os_release.indexOf('fedora') >= 0)
            filter_name = 'fedora-logo';
        else if (this.os_release.indexOf('centos') >= 0)
            filter_name = 'centos-logo';
        else if (this.os_release.indexOf('ubuntu') >= 0)
            filter_name = 'ubuntu-logo';
        else
            return undefined;
        return `url(#${filter_name})`;
    }

    // a missing 'available' means the node is OK
    unavailable_display() {
        if ((this.available == undefined)
            || (this.available == "ok"))
            return "none";
        else
            return "on";
    }

    ////////// show an icon only if usrp_type is defined
    has_usrp() {
        return (this.usrp_type || 'none') != 'none';
    }
    usrp_status_display() {
        return (this.has_usrp()) ? "on" : "none";
    }

    usrp_status_filter() {
        let filter_name;
        if ( ! this.has_usrp() )
            return undefined;
        else if (this.usrp_on_off == 'on')
            filter_name = 'gnuradio-logo-icon-green';
        else if (this.usrp_on_off == 'off')
            filter_name = 'gnuradio-logo-icon-red';
        else
            return undefined;
        return `url(#${filter_name})`;
    }

    // the radius of the circle that we need to leave free
    overall_radius() {
        let r = this.node_status_radius();
        if (! this.is_available())
            return r;
        // node is off, we need to keep space for the label
        if (r == 0)
            return 10;
        return r;
    }

    // 0.7 stands for sin(pi/2)
    usrp_offset_x() {
        let {usrp_delta_x} = livemap_options;
        return this.overall_radius() * 0.7 + usrp_delta_x;
    }
    usrp_offset_y() {
        let {usrp_delta_y} = livemap_options;
        return this.overall_radius() * 0.7 + usrp_delta_y;
    }
    usrp_x() {
        return this.x + this.usrp_offset_x();
    }
    usrp_y() {
        return this.y - (this.usrp_offset_y() + this.usrp_h());
    }
    usrp_w() {
        let {usrp_width, usrp_on_ratio, usrp_off_ratio} = livemap_options;
        return usrp_width * (this.usrp_on_off == "on" ? usrp_on_ratio : usrp_off_ratio);
    }
    usrp_h() {
        let {usrp_height, usrp_on_ratio, usrp_off_ratio} = livemap_options;
        return usrp_height * (this.usrp_on_off == "on" ? usrp_on_ratio : usrp_off_ratio); }

    clicked() {
        console.log(`in clicked ${this.id}`);
    }

    tooltip() {
        if (this.has_usrp())
            return `${this.id} : SDR is ${this.usrp_type}`;
        else
            return `${this.id} - no SDR`;
    }

}

//////////////////////////////
export class LiveMap {

    constructor() {
        let canvas_x = livemap_geometry.room_x() + 2 * livemap_options.margin_x;
        let canvas_y = livemap_geometry.room_y() + 2 * livemap_options.margin_y;
        let svg =
            d3.select('div#livemap_container')
            .append('svg')
            .attr('width', canvas_x)
            .attr('height', canvas_y)
        ;
        // we insert a g to flip the walls upside down
        // too lazy to rewrite this one
        let g =
            svg.append('g')
            .attr('id', 'walls_upside_down')
            .attr('transform', `translate(${canvas_x},${canvas_y}) rotate(180)`)
        ;

        // walls
        g.append('path')
            .attr('class', 'walls')
            .attr('d', livemap_geometry.walls_path())
                //.attr('id', 'walls')
        ;

        let {pillar_radius} = livemap_options;

        livemap_geometry.pillar_specs.forEach(function(spec) {
            let coords = livemap_geometry.grid_to_canvas(spec.i, spec.j);
            svg.append('rect')
                .attr('id', `pillar-${spec.id}`)
                .attr('class', 'pillar walls')
                .attr('x', coords[0] - pillar_radius)
                .attr('y', coords[1] - pillar_radius)
                .attr('width', 2*pillar_radius)
                .attr('height', 2*pillar_radius)
            ;
        });
        this.declare_image_filter('fedora-logo', 'png');
        this.declare_image_filter('centos-logo', 'png');
        this.declare_image_filter('ubuntu-logo', 'png');
        this.declare_image_filter('other-logo', 'png');
        this.declare_image_filter('gnuradio-logo-icon-green', 'svg');
        this.declare_image_filter('gnuradio-logo-icon-red', 'svg');
    }

    init() {
        this.init_nodes();
        this.init_phones();
        this.init_sidecar();
    }

    //////////////////// nodes
    init_nodes() {
        this.nodes = [];
        for (let mapnode_spec of livemap_geometry.mapnode_specs) {
            this.nodes.push(new MapNode(mapnode_spec));
        }
    }

    //////////////////// phones
    init_phones () {
        this.phones = [];
        for (let mapphone_spec of livemap_geometry.mapphone_specs) {
            this.phones.push(new MapPhone(mapphone_spec));
        }
    }

    //////////////////// the nodes graphical layout
    animate_nodes_changes () {
        let svg = d3.select('div#livemap_container svg');
        let animation_duration = 750;
        let circles = svg.selectAll('circle.node-status')
            .data(this.nodes, obj => obj.id);
        // circles show the overall status of the node
        circles
          .enter()
            .append('circle')
            .attr('class', 'node-status')
            .attr('id', node => node.id)
            .attr('cx', node => node.x)
            .attr('cy', node => node.y)
            .on('click', node => node.clicked())
            .each(function(node) {
                $(this).tooltip({
                    title: node.tooltip(),
                    delay:250, placement: "bottom"})
            })
          .merge(circles)
            .transition()
            .duration(animation_duration)
            .attr('r', node => node.node_status_radius())
            .attr('fill', node => node.node_status_color())
            .attr('filter', node => node.node_status_filter())
        ;

        if (livemap_options.colormap) {
            let size_x = livemap_options.space_x * .72;
            let size_y = livemap_options.space_y * .64;
            let offset_x = size_x / 2;
            let offset_y = size_y / 2;
            let group_squares = svg.selectAll('rect.node-group')
                        .data(this.nodes, obj => obj.id);
            group_squares
              .enter()
                .append('rect')
                .attr('class', 'node-group')
                .attr('x', node => node.x - offset_x)
                .attr('y', node => node.y - offset_y)
                .attr('width', size_x)
                .attr('height', size_y)
                .attr('style', node => `fill:${node.group_color}`)
            ;
        }

        // labels show the nodes numbers
        let labels = svg.selectAll('text')
            .data(this.nodes, obj => obj.id);

        labels
          .enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('font-size', livemap_options.font_size)
            .text(obj => obj.id)
            .attr('id', node => node.id)
            .attr('x', node => node.x)
            .attr('y', node => node.y)
            .on('click', node => node.clicked())
            .each(function(node) {
                $(this).tooltip({
                    title: node.tooltip(),
                    delay:250, placement: "bottom"})
            })
          .merge(labels)
            .transition()
            .duration(animation_duration)
            .attr('fill', node => node.text_color())
            .attr('x', node => node.text_x())
            .attr('y', node => node.text_y())
        ;

        // these rectangles are placeholders for the various icons
        // that are meant to show usrp status
        let usrp_rects = svg.selectAll('rect.usrp-status')
            .data(this.nodes, obj => obj.id);
        usrp_rects
          .enter()
            .append('rect')
            .attr('class', 'usrp-status')
            .attr('id', node => node.id)
            .attr('stroke-width', '1px')
            .attr('x', node => node.usrp_x())
            .attr('y', node => node.usrp_y())
            .on('click', node => node.clicked())
            .each(function(node) {
                $(this).tooltip({
                    title: node.tooltip(),
                    delay:250, placement: "bottom"})
            })
          .merge(usrp_rects)
            .transition()
            .duration(animation_duration)
            .attr('display', node => node.usrp_status_display())
            .attr('filter', node => node.usrp_status_filter())
            .attr('x', node => node.usrp_x())
            .attr('y', node => node.usrp_y())
            .attr('width', node => node.usrp_w())
            .attr('height', node => node.usrp_h())
        ;


        // how to display unavailable nodes
        let unavailables = svg.selectAll('circle.unavailable')
            .data(this.nodes, obj => obj.id);
        unavailables
          .enter()
            .append('circle')
            .attr('class', 'unavailable')
        .attr('id', node => node.id)
        .attr('cx', node => node.x)
        .attr('cy', node => node.y)

            .attr('r', () => livemap_options.radius_unavailable)
            .on('click', node => node.clicked())
          .merge(unavailables)
            .transition()
            .duration(animation_duration)
            .attr('display', node => node.unavailable_display())
        ;

    }

    //////////////////// convenience / helpers
    // filters nice_float(for background)s
    declare_image_filter (id_filename, suffix) {
        // create defs element if not yet present
        if ( ! $('#livemap_container svg defs').length) {
            d3.select('#livemap_container svg').append('defs');
        }
        // create filter in there
        let defs = d3.select("#livemap_container svg defs");
        let filter = defs.append("filter")
            .attr('id', id_filename)
            .attr('x', '0%')
            .attr('y', '0%')
            .attr('width', '100%')
            .attr('height', '100%')
        ;
        filter.append("feImage")
            .attr("xlink:href", `../assets/img/${id_filename}.${suffix}`);
    }


    //////////////////// phones graphical layout
    animate_phones_changes() {
        livemap_debug("in animate_phones_changes");
        let svg = d3.select('div#livemap_container svg');
        let animation_duration = 750;

        let w = livemap_options.phone_size;
        let h = w;

        let squares = svg.selectAll('rect.phone-status')
            .data(this.phones, obj => obj.id);
        // simple square repr. for now, with an airplane in the middle
        squares
          .enter()
            .append('rect')
            .attr('class', 'phone-status')
            .attr('id', phone => phone.id)
            .attr('x', phone => phone.x - w/2)
            .attr('y', phone => phone.y - h/2)
            .attr('width', w)
            .attr('height', h)
        ;

        let texts = svg.selectAll('text.phone-status')
            .data(this.phones, obj => obj.id);

        texts
          .enter()
            .append('text')
            .attr('class', 'phone-status')
            .attr('x', phone => phone.x)
            .attr('y', phone => phone.y)
            .attr('dy', h*.1)
            .attr('font-family', 'FontAwesome')
            .attr('font-size', h*1)
            .attr('textLength', w*.8)
            .attr('lengthAdjust', 'spacingAndGlyphs')
          .merge(texts)
            .transition()
            .duration(animation_duration)
            .text(phone => phone.text())
        ;

    }



    // the sidecar area
    animate_sidecar_status_changes () {
        livemap_debug("animate_sidecar_status_changes");
        let svg = d3.select('div#livemap_container svg');
        let status = this.sidecar.state();
        let details = livemap_geometry.sidecar_details;
        let [x, y] = livemap_geometry.grid_to_canvas(
            details.i, details.j);
        let radius = details.radius;

        let color;
        let text = livemap_options.icon_sidecar_ko;
        let tooltip = `<span>data is not updated<br/>sidecar is down`
                    + `<br/>${sidecar_url}</span>`;
        switch (status) {
            case undefined: color='gray'; break;
            case WebSocket.CONNECTING: color='orange'; break;
            case WebSocket.OPEN:
                color='green'; text = livemap_options.icon_sidecar_ok;
                tooltip = `<span>data from sidecar is live<br/>connection is OK`
                        + `<br/>${sidecar_url}</span>`; break;
            case WebSocket.CLOSING:
            case WebSocket.CLOSED:     color='red'; break;
        }
        let animation_duration = 750;

        let texts = svg.selectAll('text.sidecar-status')
            .data([status]);

        let h = radius*2.;
        let w = h;
        texts
          .enter()
            .append('text')
            .attr('class', 'sidecar-status')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', h*.1)
            .attr('font-family', 'FontAwesome')
            .attr('font-size', h*1)
            .attr('textLength', w*.8)
            .attr('lengthAdjust', 'spacingAndGlyphs')
            .each(function() {
                $(this).tooltip({
                    title: tooltip, delay:200,
                    placement: "bottom", html: true})
            })
          .merge(texts)
            .transition()
            .duration(animation_duration)
            .attr('fill', color)
            .text(text)
            .each(function() {
                $(this)
                    .attr('data-original-title', tooltip)
            })
        ;
    }

    //////////////////// specific way to handle incoming json
    // apply changes to internal data and then apply callback
    // that will reflect the changes visually
    nodes_callback (infos) {
        let livemap = this;
        // first we write this data into the MapNode structures
        infos.forEach(function(info) {
            let id = info['id'];
            let obj = locate_by_id(livemap.nodes, id);
            if (obj != undefined)
                update_obj_from_info(obj, info);
            else
                console.log(`livemap: could not locate node ${id} - ignored`);
        });
        livemap.animate_nodes_changes();
    }

    phones_callback (infos) {
        let livemap = this;
        // first we write this data into the MapNode structures
        infos.forEach(function(info) {
            let id = info['id'];
            let obj = locate_by_id(livemap.phones, id);
            if (obj != undefined)
                update_obj_from_info(obj, info);
            else
                console.log(`livemap: could not locate phone id ${id} - ignored`);
        });
        livemap.animate_phones_changes();
    }

    //////////////////// websockets business
    init_sidecar () {
        let callbacks_map = {
            status_changed: () => this.animate_sidecar_status_changes(),
            nodes:  (infos) => this.nodes_callback(infos),
            phones: (infos) => this.phones_callback(infos),
        };
        let categories = ['nodes', 'phones'];
        // this actually is a singleton
        this.sidecar = Sidecar();
        this.sidecar.register_callbacks_map(callbacks_map);
        this.sidecar.register_categories(categories);
        this.sidecar.open();
    }

}

// autoload
$(function() {
    scale_options();
    let livemap = new LiveMap();
    livemap.init();
})
