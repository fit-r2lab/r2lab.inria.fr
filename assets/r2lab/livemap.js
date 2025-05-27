/* for eslint */
/*global $ d3 */

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/livemap.css")

import { Sidecar } from "/assets/r2lab/sidecar.js"

// the space between nodes is the unit
const UNIT = 80

// re-configurable from the markdown
export let livemap_options = {

  ratio: 1.,                        // just set this if you need scaling
  _scaled: false,                   // don't touch this one

  // overall layout
  margin_x: 50, margin_y: 50,       // the space around the walls in the canvas
  antennas_margin_x: UNIT,          // the space for drawing antennas
  antennas_margin_y: UNIT,          // the y would come in handy if we had another row
                                    // of extra space on top of the map
  // antennas use the same spacing as nodes
  space_x: UNIT, space_y: UNIT,         // distance between nodes
  padding_x: UNIT/2, padding_y: UNIT/2,     // distance between nodes and walls

  // pillars
  pillar_radius: 16,                // pillars - derived from the walls

  // nodes
  radius_unavailable: 18,           // size for rendering nodes status
  radius_ok: 18,
  radius_pinging: 12,
  radius_warming: 6,
  radius_ko: 0,

  font_size: 16,
  phone_size: 30,
  pdu_radius: 20,

  // usrp/gnuradio thingy
  // full size for the usrp-icon
  // this is arbitrary but has the right width/height ratio
  usrp_width: 15,
  usrp_height: 25,
  // on and off units get rendered each at their size
  usrp_on_ratio: .90,
  usrp_off_ratio: .70,
  // how much we move from the north-east intersection
  // with node radius circle
  usrp_delta_x: 2,
  usrp_delta_y: 3,

  // still using font-awesome v4 for the symbols inside a svg/d3 area
  // see http://stackoverflow.com/questions/14984007/how-do-i-include-a-font-awesome-icon-in-my-svg
  // and http://stackoverflow.com/questions/12882885/how-to-add-nbsp-using-d3-js-selection-text-method/12883617#12883617
  // parmentelat ~/git/Font-Awesome/less $ grep 'fa-var-plane' variables.less
  // @fa-var-plane: "\f072";
  icon_plane_content: "\uf072",
  icon_phone_content: "\uf095",
  icon_question_content: "\uf128",
  // using font-awesome v5 is problematic here
  // most of the icons we need seem to be part of the 'Font Awesome 5 Pro'
  // font-family, while only the 'Free' and 'Brands' font-families are available to us
  // for the record though
  // icon_plane_content : "\uf5b0",
  // icon_phone_content : "\uf095",
  // icon_question_content : "\uf128",

  icon_sidecar_ok: "\uf14a",
  icon_sidecar_ko: "\uf057",

  // override this with a ColorMap object if desired
  colormap: null,

  debug: false,

}

function livemap_debug(...args) {
  if (livemap_options.debug)
    console.debug(`${new Date()}`, ...args)
}


function scale_options() {
  // do it just once
  if (livemap_options._scaled)
    return
  const ratio = livemap_options.ratio
  livemap_options.margin_x *= ratio
  livemap_options.margin_y *= ratio
  livemap_options.antennas_margin_x *= ratio
  livemap_options.antennas_margin_y *= ratio
  livemap_options.space_x *= ratio
  livemap_options.space_y *= ratio
  livemap_options.padding_x *= ratio
  livemap_options.padding_y *= ratio
  livemap_options.pillar_radius *= ratio
  livemap_options.radius_unavailable *= ratio
  livemap_options.radius_ok *= ratio
  livemap_options.radius_pinging *= ratio
  livemap_options.radius_warming *= ratio
  livemap_options.radius_ko *= ratio
  livemap_options.font_size *= ratio
  livemap_options.phone_size *= ratio
  livemap_options.pdu_radius *= ratio

  livemap_options._scaled = true
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
  mapnode_specs: [
    { id:  1, i: 0, j: 0 },
    { id:  2, i: 0, j: 1 },
    { id:  3, i: 0, j: 2 },
    { id:  1, i: 0, j: 3, nodepc: true,         // formerly node4
      // xxx would be nicer to fetch this from the database...
      usrp_name: "usrp01", usrp_type: "b210"},
    { id:  5, i: 0, j: 4 },
    { id:  6, i: 1, j: 0 },
    { id:  7, i: 1, j: 1 },
    { id:  8, i: 1, j: 2 },
    { id:  9, i: 1, j: 3 },
    { id: 10, i: 1, j: 4 },
    { id: 11, i: 2, j: 0 },
    { id: 12, i: 2, j: 1 },
    { id: 2, i: 2, j: 2, nodepc: true,          // formerly node13
      // xxx would be nicer to fetch this from the database...
      usrp_name: "usrp02", usrp_type: "b210"},
    { id: 14, i: 2, j: 3 },
    { id: 15, i: 2, j: 4 },
    { id: 16, i: 3, j: 0 },
    { id: 17, i: 3, j: 2 },
    { id: 18, i: 3, j: 3 },
    { id: 19, i: 4, j: 0 },
    { id: 20, i: 4, j: 1 },
    { id: 21, i: 4, j: 2 },
    { id: 22, i: 4, j: 3 },
    { id: 23, i: 5, j: 0 },
    { id: 24, i: 5, j: 2 },
    { id: 25, i: 5, j: 3 },
    { id: 26, i: 6, j: 0 },
    { id: 27, i: 6, j: 1 },
    { id: 28, i: 6, j: 2 },
    { id: 29, i: 6, j: 3 },
    { id: 30, i: 6, j: 4 },
    { id: 31, i: 7, j: 0 },
    { id: 32, i: 7, j: 1 },
    { id: 33, i: 7, j: 2 },
    { id: 34, i: 7, j: 3 },
    { id: 35, i: 7, j: 4 },
    { id: 36, i: 8, j: 3 },
    { id: 37, i: 8, j: 4 },
  ],

  ////////// the  two pillars - this is manual
  pillar_specs: [
    { id: 'left', i: 3, j: 1 },
    { id: 'right', i: 5, j: 1 },
  ],

  sidecar_details: {
    icon_x_rank: 9.25, icon_y_rank: 1, icon_units: 'grid', radius: 20,
  },

  // here we have i and j refer to the antennas grid/space
  // i = 0 means in the vertical space at the left of the walls
  // j = 0 will be for the horizontal space on top, if/when needed
  //
  // on the other hand the node_i and node_j coords refer to the walls grid
  mapphone_specs: [
    { id: 1, icon_x_rank: 9.25, icon_y_rank: 2, location_x_grid: 0.5, location_y_grid: -0.2, icon_units: 'grid'},
    { id: 2, icon_x_rank: 9.25, icon_y_rank: 3, location_x_grid: 1.5, location_y_grid: -0.5, icon_units: 'grid'},
  ],

  //////////////////// configuration
  // max i and j
  steps_x: 8, steps_y: 4,

  // the overall room size
  // xxx check this actually takes into account options when redefined later on
  room_x: function () {
    return this.steps_x * livemap_options.space_x + 2 * livemap_options.padding_x
  },
  room_y: function () {
    return this.steps_y * livemap_options.space_y + 2 * livemap_options.padding_y
  },

  // translate i, j into actual coords
  grid_to_canvas: function (i, j) {
    const {margin_x, margin_y, antennas_margin_x, antennas_margin_y,
           padding_x, padding_y, space_x, space_y} = livemap_options
    return [
      margin_x + antennas_margin_x + padding_x + i * space_x
      ,
      margin_y + antennas_margin_y + padding_y + j * space_y
    ]
  },

  // translate an antennas ixj into actual coords
  // use same spacing as nodes for easier alignments
  // this is when using the 'grid' icon_units
  antennas_to_canvas: function (i, j, icon_units) {
    const {margin_x, margin_y, antennas_margin_x, antennas_margin_y,
           padding_x, padding_y, space_x, space_y, pdu_radius} = livemap_options
    const [zero_x, zero_y] = [margin_x + antennas_margin_x/2, margin_y + antennas_margin_y/2]
    let unit_x, unit_y
    if (icon_units == 'grid') {
      [unit_x, unit_y] = [space_x, space_y]
    } else if (icon_units == 'rank') {
      [unit_x, unit_y] = [2*pdu_radius, 2*pdu_radius]
    } else {
      console.error(`livemap_geometry.antennas_to_canvas: unknown icon_units ${icon_units}`)
      return [0, 0] // it's an error
    }
    const x = (i) => zero_x + antennas_margin_x/2 + padding_x + (i-1) * unit_x
    const y = (j) => zero_y + antennas_margin_y/2 + padding_y + (j-1) * unit_y
    if (i ==0 && j == 0) {
      // the upper left corner
      return [zero_x, zero_y]
    } else if (i == 0) {
      // the vertical row
      return [zero_x, y(j)]
    } else if (j == 0) {
      // the horizontal row
      return [x(i), zero_y]
    } else {
      // in the grid
      return [x(i), y(j)]
    }
  },

  //////////////////////////////
  // our mental model is y increase to the top, not to the bottom
  // also, using l (relative) instead of L (absolute) is simpler
  // but it keeps roundPathCorners from rounding.js from working fine
  // keep it this way from now, a class would help keep track here
  line_x: x => `l ${x} 0 `,
  line_y: y => `l 0 ${-y} `,

  walls_path: function () {
    const {margin_x, margin_y, antennas_margin_x, antennas_margin_y,
      padding_x, padding_y, space_x, space_y, } = livemap_options
    const moves = [
      // start in X; define the direction, number of space_ and of padding_
      [1, 7, 2],
      [1, 3, 0],    // now in Y
                    // and so on
      [1, 1, 0],    // x
      [1, 1, 2],    // y
      [-1, 2, 2],   // x
      [-1, 1, 0],   // y
      [-1, 4, -2],  // x
      [1, 1, 0],    // y
      [-1, 2, 2],   // x
      [-1, 4, 2],   // y
     ]
    let x_y = 0
    let path = `M ${margin_x + antennas_margin_x} ${margin_y+antennas_margin_y} `

    for (let [direction, spaces, paddings] of moves) {
      if (x_y == 0) {
        let length = (spaces * space_x + paddings * padding_x) * direction
        path += this.line_x(length)
      } else {
        // svg is supposed to have the y axis go from top to bottom
        // weird that the Y axis seems to be that way..
        let length = (spaces * space_y + paddings * padding_y) * -1 * direction
        path += this.line_y(length)
      }
      x_y = (x_y+1)%2
    }
  //  the path is already closed but without the Z
  //  the initial corner is not well finished
    path += "Z"
    return path
  },

}

////////////////////////////////////////
// helpers
// locating a record by id in a list
function locate_by_id(list_objs, id) {
  for (let obj of list_objs) {
    if (obj.id == id) {
      return obj
    }
  }
  // livemap_debug(`ERROR: livemap: locate_by_id: id= ${id} was not found`)
}


// obj_info is a dict coming through sidecar
// simply copy the fieds present in this dict in the local object
// for further usage in animate_nodes_changes
function update_obj_from_info(obj, obj_info) {
  let modified = false
  for (let prop in obj_info) {
    if (obj_info[prop] != obj[prop]) {
      obj[prop] = obj_info[prop]
      modified = true
    }
  }
  return modified
}


//////////////////////////////
// nodes are dynamic
// their visual rep. get created through d3 enter mechanism
class MapNode {

  constructor(node_spec) {
    this.id = node_spec.id
    // i and j refer to a logical grid
    this.i = node_spec.i
    this.j = node_spec.j
    // compute actual coordinates
    let [x, y] = livemap_geometry.grid_to_canvas(this.i, this.j)
    this.x = x
    this.y = y

    if (livemap_options.colormap) {
      this.group_color = livemap_options.colormap.color(this.id)
    }
  }

  is_available() {
    return this.available != 'ko'
  }

  fully_booted() {
    return this.cmc_on_off == 'on'
      && this.control_ping == 'on'
      && this.control_ssh != 'off'
  }

  // shift label south-east a little
  // we cannot just add a constant to the radius
  text_offset(radius) {
    return Math.max(5, 12 - radius / 2)
  }
  text_x() {
    if (!this.is_available()) return this.x
    const radius = this.node_status_radius()
    const delta = this.text_offset(radius)
    return this.x + ((radius == 0) ? 0 : (radius + delta))
  }

  text_y() {
    if (!this.is_available()) return this.y
    const radius = this.node_status_radius()
    const delta = this.text_offset(radius)
    return this.y + ((radius == 0) ? 0 : (radius + delta))
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
      return livemap_options.radius_ko
    // does not even ping
    else if (this.control_ping != 'on')
      return livemap_options.radius_warming
    // pings but cannot get ssh
    else if (this.control_ssh != 'on')
      return livemap_options.radius_pinging
    // ssh is answering
    else
      return livemap_options.radius_ok
  }

  // right now this is visible only for intermediate radius
  // let's show some lightgreen for the 2/3 radius (ssh is up)
  text_color() {
    return '#555'
  }

  // luckily this is not rendered when a filter is at work
  node_status_color() {
    let radius = this.node_status_radius()
    return (radius == livemap_options.radius_pinging) ? d3.rgb('#71edb0').darker() :
      (radius == livemap_options.radius_warming) ? d3.rgb('#f7d8dd').darker() :
        '#bbb'
  }

  // showing an image (or not, if filter is undefined)
  // depending on the OS
  node_status_filter() {
    let filter_name
    // only set a filter with full-fledged nodes
    if (!this.fully_booted())
      return undefined
    // remember infos might be incomplete
    if (this.os_release == undefined)
      return undefined
    if (this.os_release.indexOf('other') >= 0)
      filter_name = 'other-logo'
    else if (this.os_release.indexOf('fedora') >= 0)
      filter_name = 'fedora-logo'
    else if (this.os_release.indexOf('centos') >= 0)
      filter_name = 'centos-logo'
    else if (this.os_release.indexOf('ubuntu') >= 0)
      filter_name = 'ubuntu-logo'
    else
      return undefined
    return `url(#${filter_name})`
  }

  // a missing 'available' means the node is OK
  unavailable_display() {
    if ((this.available == undefined)
      || (this.available == "ok"))
      return "none"
    else
      return "on"
  }

  ////////// show an icon only if usrp_type is defined
  has_usrp() {
    return (this.usrp_type || 'none') != 'none'
  }
  usrp_status_display() {
    return (this.has_usrp()) ? "on" : "none"
  }

  usrp_status_filter() {
    if (!this.has_usrp())
      return undefined
    let filter_name
    const prefix = (this.usrp_logo) == "antenna" ? "antenna"
                 : (this.ursp_logo == "mobile") ? "mobile"
                 : "gnuradio"
    if (this.usrp_logo != "antenna") {
      if (this.usrp_on_off == 'on')
        filter_name = 'gnuradio-green'
      else if (this.usrp_on_off == 'off')
        filter_name = 'gnuradio-gray-bold'
      else
        filter_name = 'gnuradio-red'
    } else {
      if (this.usrp_on_off == 'on')
        filter_name = 'antenna-green'
      else if (this.usrp_on_off == 'off')
        filter_name = 'antenna-gray-bold'
      else
        filter_name = 'antenna-red'
    }
    return `url(#${filter_name})`
  }

  // the radius of the circle that we need to leave free
  overall_radius() {
    if (!this.is_available())
      return livemap_options.radius_unavailable
    let r = this.node_status_radius()
    // node is off, we need to keep space for the label
    if (r == 0)
      return 10
    return r
  }

  // 0.7 stands for sin(pi/2)
  usrp_offset_x() {
    let { usrp_delta_x } = livemap_options
    return this.overall_radius() * 0.7 + usrp_delta_x
  }
  usrp_offset_y() {
    let { usrp_delta_y } = livemap_options
    return this.overall_radius() * 0.7 + usrp_delta_y
  }
  usrp_x() {
    return this.x + this.usrp_offset_x()
  }
  usrp_y() {
    return this.y - (this.usrp_offset_y() + this.usrp_h())
  }
  usrp_w() {
    let { usrp_width, usrp_on_ratio, usrp_off_ratio } = livemap_options
    return usrp_width * (this.usrp_on_off == "on" ? usrp_on_ratio : usrp_off_ratio)
  }
  usrp_h() {
    let { usrp_height, usrp_on_ratio, usrp_off_ratio } = livemap_options
    return usrp_height * (this.usrp_on_off == "on" ? usrp_on_ratio : usrp_off_ratio)
  }

  clicked() {
    // toggle this node in the live column if present
    const row = `row${this.id}`
    document.querySelectorAll(`.livecolumns_body>#${row}`).forEach(
      (elt) => {
        if (elt.style.display === "none") {
          elt.style.display = "table-row"
        } else {
          elt.style.display = "none"
        }
      }
    )
  }

  tooltip() {
    if (this.has_usrp())
      return `${this.id} : SDR is ${this.usrp_type}`
    else
      return `${this.id} - no SDR`
  }

}

class MapNodePc extends MapNode {

    constructor(node_spec) {
      super(node_spec)
      // see xxx above
      this.usrp_name = node_spec.usrp_name
      this.usrp_type = node_spec.usrp_type
    }

    tooltip() {
      if (this.has_usrp())
        return `pc0${this.id} : SDR is ${this.usrp_type} (${this.usrp_name})`
      else
        return `${this.id} - no SDR`
    }

    node_status_fill() {
      return (this.on_off == 'on')
        ? '#BDB8'          // light greenish with half transparency
        : 'rgba(0,0,0,0)'  // transparent
    }
    node_status_stroke_width() {
      return (this.on_off == 'on') ? 0 : 0.5
    }
}


//////////////////////////////
// the root class for MapPhone and MapPdu
class MapAntenna {

  constructor(antenna_spec) {
    this.id = antenna_spec.id
    this.icon_x_rank = antenna_spec.icon_x_rank
    this.icon_y_rank = antenna_spec.icon_y_rank
    this.location_x_grid = antenna_spec.location_x_grid
    this.location_y_grid = antenna_spec.location_y_grid
    this.icon_units = antenna_spec.icon_units || 'grid'
    this.label = antenna_spec.label || "antenna"

    let [x, y] = livemap_geometry.antennas_to_canvas(this.icon_x_rank, this.icon_y_rank, this.icon_units)
    this.x = x
    this.y = y
  }

  show_location_annotations() {
    for (let elt of this._location_annotations)
      elt.style.display = "inline"
  }
  hide_location_annotations() {
    for (let elt of this._location_annotations)
      elt.style.display = "none"
  }
  tooltip_placement() {
    // some default, override if needed
    return 'left'
  }
  annotation_color() {
    // override this in the derived classes
    console.log("antenna color", this.label, this)
    return 'rgba(80, 80, 80, 0.5)'
  }

}

class MapPhone extends MapAntenna {

  constructor(phone_spec) {
    super(phone_spec)
  }

  text() {
    if (this.airplane_mode == 'on')
      return livemap_options.icon_plane_content
    else if (this.airplane_mode == 'off')
      return livemap_options.icon_phone_content
    else
      return livemap_options.icon_question_content
  }

  tooltip_text() {
    return `macphone${this.id}`
  }
  tooltip_placement() {
    return 'right'
  }
  annotation_color() {
    console.log("phone color", this.label, this)
    return 'rgb(193, 65, 65)'
  }

}

class MapPdu extends MapAntenna {

  constructor(pdu_spec) {
    super(pdu_spec)
  }

  antenna_status_url() {
    const prefix = (this.label) == "UE" ? "mobile" : "antenna"
    let image_name
    if (this.on_off == 'on')
      image_name = `${prefix}-green`
    else if (this.on_off == 'off')
      image_name = `${prefix}-gray`
    else
      image_name = `${prefix}-red`
    return `../assets/img/${image_name}.svg`
  }
  tooltip_text() {
    return `${this.label} ${this.id}`
  }
  tooltip_placement() {
    if (this.icon_x_rank) {
      return 'top'
    } else {
      return 'left'
    }
  }
  annotation_color() {
    console.log("pdu color", this.label, this)
    return (this.label === "UE") ? 'rgb(65, 84, 193)' : 'rgb(80, 193, 65)'
  }
}

//////////////////////////////
export class LiveMap {

  constructor() {
    const {antennas_margin_x, antennas_margin_y, margin_x, margin_y} = livemap_options
    const canvas_x = margin_x + antennas_margin_x + livemap_geometry.room_x() + margin_x
    const canvas_y = margin_y + antennas_margin_y + livemap_geometry.room_y() + margin_y
    let svg =
      d3.select('div#livemap_container')
        .append('svg')
        .attr('width', canvas_x)
        .attr('height', canvas_y)

    let g =
      svg.append('path')
      .attr('class', 'walls')
      .attr('d', livemap_geometry.walls_path())
    //.attr('id', 'walls')

    const { pillar_radius } = livemap_options

    livemap_geometry.pillar_specs.forEach(function (spec) {
      let [x, y] = livemap_geometry.grid_to_canvas(spec.i, spec.j)
      svg.append('rect')
        .attr('id', `pillar-${spec.id}`)
        .attr('class', 'pillar walls')
        .attr('x', x - pillar_radius)
        .attr('y', y - pillar_radius)
        .attr('width', 2 * pillar_radius)
        .attr('height', 2 * pillar_radius)
    })
    this.declare_image_filter('fedora-logo', 'png')
    this.declare_image_filter('centos-logo', 'png')
    this.declare_image_filter('ubuntu-logo', 'png')
    this.declare_image_filter('other-logo', 'svg')
    this.declare_image_filter('gnuradio-green', 'svg')
    this.declare_image_filter('gnuradio-gray-bold', 'svg')
    this.declare_image_filter('gnuradio-red', 'svg')
    this.declare_image_filter('forbidden', 'svg')
    this.declare_image_filter('antenna-green', 'svg')
    this.declare_image_filter('antenna-gray', 'svg')
    this.declare_image_filter('antenna-gray-bold', 'svg')
    this.declare_image_filter('antenna-red', 'svg')
    this.declare_image_filter('mobile-green', 'svg')
    this.declare_image_filter('mobile-gray', 'svg')
    this.declare_image_filter('mobile-red', 'svg')
  }

  init() {
    this.init_nodes()
    this.init_phones()
    this.init_pdus()
    this.init_sidecar()
  }

  //////////////////// nodes
  init_nodes() {
    this.nodes = []
    this.nodepcs = []
    // this map contains the names of the usrps attached to nodepc's
    this.nodepc_usrpnames_to_nodes = new Map()
    for (let mapnode_spec of livemap_geometry.mapnode_specs) {
      if (mapnode_spec.nodepc) {
        const nodepc = new MapNodePc(mapnode_spec)
        this.nodepcs.push(nodepc)
        if (mapnode_spec.usrp_name) {
          this.nodepc_usrpnames_to_nodes.set(mapnode_spec.usrp_name, nodepc)
        }
      } else {
        this.nodes.push(new MapNode(mapnode_spec))
      }
    }
    this.all_nodes = this.nodes.concat(this.nodepcs)
  }

  //////////////////// phones
  init_phones() {
    this.phones = []
    for (let mapphone_spec of livemap_geometry.mapphone_specs) {
      this.phones.push(new MapPhone(mapphone_spec))
    }
  }

  //////////////////// pdus
  init_pdus() {
    this.pdus = []
  }

  //////////////////// the nodes graphical layout
  animate_nodes_changes() {
    console.debug("animate_nodes_changes", this.pdus)
    const svg = d3.select('div#livemap_container svg')
    const animation_duration = 750
    const circles = svg.selectAll('circle.node-status')
      .data(this.nodes, obj => obj.id)
    // circles show the overall status of the node
    circles
      .enter()
      .append('circle')
      .attr('class', 'node-status')
      .attr('id', node => node.id)
      .attr('cx', node => node.x)
      .attr('cy', node => node.y)
      .on('click', node => node.clicked())
      .each(function (node) {
        $(this).tooltip({
          title: node.tooltip(),
          delay: 250, placement: "bottom"
        })
      })
      .merge(circles)
      .transition()
      .duration(animation_duration)
      .attr('r', node => node.node_status_radius())
      .attr('fill', node => node.node_status_color())
      .attr('filter', node => node.node_status_filter())

    const squares = svg.selectAll('rect.nodepc-status')
      .data(this.nodepcs, obj => obj.id)
    // squares show the overall status of the nodepc
    const [sqw, sqh, sqr] = [22, 22, 4]
    squares
      .enter()
      .append('rect')
      .attr('class', 'nodepc-status')
      .attr('id', nodepc => nodepc.id)
      .attr('width', sqw)
      .attr('height', sqh)
      .attr('rx', sqr)
      .attr('ry', sqr)
      .attr('fill', nodepc => nodepc.node_status_color())
      .attr('x', nodepc => nodepc.x - sqw / 2)
      // shift the square up a little
      .attr('y', nodepc => nodepc.y - sqh / 2 - 2)
      .on('click', nodepc => nodepc.clicked())
      .each(function (nodepc) {
        $(this).tooltip({
          title: nodepc.tooltip(),
          delay: 250, placement: "bottom"
        })
      })
      .merge(squares)
      .transition()
      .duration(animation_duration)
      .attr('fill', node => node.node_status_fill())
      .attr('stroke-width', nodepc => nodepc.node_status_stroke_width())
      .attr('stroke', 'rgba(4, 4, 4, 8)')


    if (livemap_options.colormap) {
      let size_x = livemap_options.space_x * .72
      let size_y = livemap_options.space_y * .64
      let offset_x = size_x / 2
      let offset_y = size_y / 2
      let group_squares = svg.selectAll('rect.node-group')
        .data(this.nodes, obj => obj.id)
      group_squares
        .enter()
        .append('rect')
        .attr('class', 'node-group')
        .attr('x', node => node.x - offset_x)
        .attr('y', node => node.y - offset_y)
        .attr('width', size_x)
        .attr('height', size_y)
        .attr('style', node => `fill:${node.group_color}`)
    }

    // labels show the nodes numbers
    let labels = svg.selectAll('text')
      .data(this.all_nodes, obj => obj.id)

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
      .each(function (node) {
        $(this).tooltip({
          title: node.tooltip(),
          delay: 250, placement: "bottom"
        })
      })
      .merge(labels)
      .transition()
      .duration(animation_duration)
      .attr('fill', node => node.text_color())
      .attr('x', node => node.text_x())
      .attr('y', node => node.text_y())

    // these rectangles are placeholders for the various icons
    // that are meant to show usrp status
    const usrp_rects = svg.selectAll('rect.usrp-status')
      .data(this.all_nodes, obj => obj.id)
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
          delay: 250, placement: "bottom"
        })
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


    // how to display unavailable nodes
    const { radius_unavailable } = livemap_options
    let unavailables = svg.selectAll('circle.unavailable')
      .data(this.nodes, obj => obj.id)
    unavailables
      .enter()
      .append('circle')
      .attr('class', 'unavailable')
      .attr('id', node => node.id)
      .attr('cx', node => node.x)
      .attr('cy', node => node.y)
      .attr('r', radius_unavailable)
      .attr('filter', () => `url(#forbidden)`)
      .on('click', node => node.clicked())
      .merge(unavailables)
      .transition()
      .duration(animation_duration)
      .attr('display', node => node.unavailable_display())

  }

  //////////////////// convenience / helpers
  // filters nice_float(for background)s
  declare_image_filter(id_filename, suffix) {
    // create defs element if not yet present
    if (document.querySelectorAll('#livemap_container svg defs').length == 0) {
      d3.select('#livemap_container svg').append('defs')
    }
    // create filter in there
    let defs = d3.select("#livemap_container svg defs")
    let filter = defs.append("filter")
      .attr('id', id_filename)
      .attr('x', '0%')
      .attr('y', '0%')
      .attr('width', '100%')
      .attr('height', '100%')

    filter.append("feImage")
      .attr("xlink:href", `../assets/img/${id_filename}.${suffix}`)
  }

    // the purpose of the location annotations is to
    // help pinpoint where the device is located on the map
    renderAnnotations({ svg, data, livemap_geometry}) {
    const klass = 'location-annotation'
    const annotations = svg.selectAll(`line.${klass}`)
      .data(data, obj => obj.id);
    const animation_duration = 750

    annotations
      .enter()
      .append('line')
      .attr('class', klass)
      .attr('x1', pdu => pdu.x)
      .attr('y1', pdu => pdu.y)
      .attr('x2', pdu => livemap_geometry.grid_to_canvas(
        pdu.location_x_grid, pdu.location_y_grid)[0])
      .attr('y2', pdu => livemap_geometry.grid_to_canvas(
        pdu.location_x_grid, pdu.location_y_grid)[1])
      .each(function (pdu) {
        // store it in the pdu object for hide and show
        pdu._location_annotations = [this]
        console.log("stored line in pdu", pdu)
      })
      .attr('display', 'none')
      .merge(annotations)
      .transition()
      .duration(animation_duration)
      .attr('stroke', pdu => pdu.annotation_color())
  }


  //////////////////// phones graphical layout
  animate_phones_changes() {
    const svg = d3.select('div#livemap_container svg')
    const animation_duration = 750

    const w = livemap_options.phone_size
    const h = w

    const squares = svg.selectAll('rect.phone-status')
      .data(this.phones, obj => obj.id)
    // simple square repr. for now, with an airplane in the middle
    squares
      .enter()
      .append('rect')
      .attr('class', 'phone-status')
      .attr('id', phone => phone.id)
      .attr('x', phone => phone.x - w / 2)
      .attr('y', phone => phone.y - h / 2)
      .attr('width', w)
      .attr('height', h)

    const texts = svg.selectAll('text.phone-status')
      .data(this.phones, obj => obj.id)

    texts
      .enter()
      .append('text')
      .attr('class', 'phone-status')
      .attr('x', phone => phone.x)
      .attr('y', phone => phone.y)
      .attr('dy', h * .1)
      .attr('font-family', 'FontAwesome')
      .attr('font-size', h * 1)
      .attr('textLength', w * .8)
      .attr('lengthAdjust', 'spacingAndGlyphs')
      .each(function(phone) {
        // this is the DOM element, so here the <text>
        $(this).tooltip({
          title: phone.tooltip_text(),
          placement: 'left',
          delay: 250,
        })
      })
      .on('mouseover', function(d, i) {
        d.show_location_annotations()
      })
      .on('mouseout', function(d, i) {
        d.hide_location_annotations()
      })
      .merge(texts)
      .transition()
      .duration(animation_duration)
      .text(phone => phone.text())

    this.renderAnnotations({svg, data: this.phones, livemap_geometry})
  }

  animate_pdus_changes() {
    // console.debug("animate_pdus_changes")
    const svg = d3.select('div#livemap_container svg')
    const r = livemap_options.pdu_radius
    const animation_duration = 750
    const images = svg.selectAll('image.pdu-status')
      .data(this.pdus, (obj) => obj.id)
    images
      .enter()
      .append('image')
      .attr('class', 'pdu-status')
      .attr('id', pdu => pdu.id)
      .attr('x', pdu => pdu.x - r)
      .attr('y', pdu => pdu.y - r)
      .attr('width', r * 2)
      .attr('height', r * 2)
      // .attr('r', r)
      .each(function(pdu) {
        $(this).tooltip({
          title: pdu.tooltip_text(),
          placement: pdu.tooltip_placement(),
          delay: 250,
        })
      })
      .on('mouseover', function(d) {
        d.show_location_annotations()
      })
      .on('mouseout', function(d) {
        d.hide_location_annotations()
      })
      // .attr('color') xxx
      .merge(images)
      .transition()
      .duration(animation_duration)
      .attr('href', (pdu) => pdu.antenna_status_url())

    this.renderAnnotations({svg, data: this.pdus, livemap_geometry})
  }


  // the sidecar area
  animate_sidecar_status_changes() {
    livemap_debug("animate_sidecar_status_changes")
    let svg = d3.select('div#livemap_container svg')
    let status = this.sidecar.state()
    let details = livemap_geometry.sidecar_details
    let [x, y] = livemap_geometry.antennas_to_canvas(
      details.icon_x_rank, details.icon_y_rank, details.icon_units)
    let radius = details.radius

    let color
    let text = livemap_options.icon_sidecar_ko
    let tooltip = `<span>data is not updated<br/>sidecar is down`
      + `<br/>${sidecar_url}</span>`
    switch (status) {
      case undefined:
        color = 'gray'
        break
      case WebSocket.CONNECTING:
        color = 'orange'
        break
      case WebSocket.OPEN:
        color = 'green'
        text = livemap_options.icon_sidecar_ok
        tooltip = `<span>data from sidecar is live<br/>connection is OK`
          + `<br/>${sidecar_url}</span>`
        break
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        color = 'red'
        break
    }
    const animation_duration = 750

    let texts = svg.selectAll('text.sidecar-status')
      .data([status])

    const h = radius * 2.
    const w = h
    texts
      .enter()
      .append('text')
      .attr('class', 'sidecar-status')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', h * .1)
      .attr('font-family', 'FontAwesome')
      .attr('font-size', h * 1)
      .attr('textLength', w * .8)
      .attr('lengthAdjust', 'spacingAndGlyphs')
      .each(function () {
        $(this).tooltip({
          title: tooltip, delay: 200,
          placement: "bottom", html: true
        })
      })
      .merge(texts)
      .transition()
      .duration(animation_duration)
      .attr('fill', color)
      .text(text)
      .each(function () {
        $(this)
          .attr('data-original-title', tooltip)
      })
  }

  //////////////////// specific way to handle incoming json
  // apply changes to internal data and then apply callback
  // that will reflect the changes visually
  nodes_callback(infos) {
    let livemap = this
    // first we write this data into the MapNode structures
    infos.forEach(function (info) {
      let id = info.id
      let obj = locate_by_id(livemap.nodes, id)
      if (obj != undefined)
        update_obj_from_info(obj, info)
      else
        livemap_debug(`livemap: could not locate node ${id} - ignored`)
    })
    livemap.animate_nodes_changes()
  }

  phones_callback(infos) {
    let livemap = this
    // first we write this data into the MapNode structures
    infos.forEach(function (info) {
      let id = info.id
      let obj = locate_by_id(livemap.phones, id)
      if (obj != undefined)
        update_obj_from_info(obj, info)
      else
        livemap_debug(`livemap: could not locate phone id ${id} - ignored`)
    })
    livemap.animate_phones_changes()
  }

  // we no longer rely on a static list of antennas/pdus to be displayed
  // this function takes care of updating this.pdus from received infos
  // in a first version we only add new antennas
  // as deletions can be handled by reloading the page
  update_pdus(infos) {
    const find_pdu = (name) => {
      for (const pdu of this.pdus) {
        if (pdu.id == name) {
          return pdu
        }
      }
      return undefined
    }
    for (const info of infos) {
      // ignore pdus that have no icon_x_rank
      if (!info.hasOwnProperty('icon_x_rank'))
        continue
      // ignore if pdu already present
      if (find_pdu(info.id))
        // likewise, this should maybe update the pdu
        // but a page reload will do the job
        continue
      this.pdus.push(new MapPdu(info))
    }
  }

  // usrp.. entries will be found in livemap.nodepc_usrpnames_to_nodes
  // pc... entries in the pdus area are mapped to corresponding nodepcs
  pdus_callback(infos) {
    const NODEPC_PATTERN = /^pc(\d+)$/
    // console.debug("pdus_callback, infos=")
    this.update_pdus(infos)
    const livemap = this
    infos.forEach(function (info) {
      const {id} = info
      // usrps attached to nodepc's
      let nodepc
      if (nodepc = livemap.nodepc_usrpnames_to_nodes.get(id)) {
        // console.debug(`pdus_callback (1) nodepc's ursp id=${id}`, nodepc)
        nodepc.usrp_on_off = info.on_off
      // pc.. are recognized by a hard-wired pattern
      } else if (id.match(NODEPC_PATTERN)) {
        const nodepc_id = parseInt(id.match(NODEPC_PATTERN)[1])
        // xxx something super fishy is going on here, we need to do this
        // dual search because we see the first form being used during intialization
        // and the second form being successful later on during updates
        const nodepc = locate_by_id(livemap.nodepcs, nodepc_id)
                    || locate_by_id(livemap.nodepcs, id)
        if (nodepc != undefined) {
          // console.debug(`pdus_callback (2) nodepc ${id}`, nodepc)
          update_obj_from_info(nodepc, info)
        } else {
          console.warn(`livemap: could not locate nodepc id ${id} - ignored`)
          console.debug(livemap.nodepcs)
        }
      // otherwise we search them in the pdus area
      } else {
        const pdu = locate_by_id(livemap.pdus, id)
        // not all known pdus are present on the map, so ignore if not found
        if (pdu != undefined) {
          // console.debug(`pdus_callback (3) actual pdu id=${id}`, pdu)
          update_obj_from_info(pdu, info)
        }
      }
    })
    livemap.animate_pdus_changes()
    // this is needed because of the changes made to nodepcs
    // or their attached usrps
    livemap.animate_nodes_changes()
  }

  //////////////////// websockets business
  init_sidecar() {
    let callbacks_map = {
      status_changed: () => this.animate_sidecar_status_changes(),
      nodes: (infos) => this.nodes_callback(infos),
      phones: (infos) => this.phones_callback(infos),
      pdus: (infos) => this.pdus_callback(infos),
    }
    let categories = ['nodes', 'phones', 'pdus']
    // this actually is a singleton
    this.sidecar = Sidecar()
    this.sidecar.register_callbacks_map(callbacks_map)
    this.sidecar.register_categories(categories)
    this.sidecar.open()
  }

}

function toggle_annotations() {
  // Update the UI to show/hide annotations
  // set all element to the same value
  // in case a lingering one would be off wrt the others
  const all_annotations = document.querySelectorAll('.location-annotation')
  let new_style = undefined

  for (let elt of all_annotations) {
    // compute new_style from the first element
    if (new_style == undefined) {
      new_style = (elt.style.display == "none") ? "inline" : "none"
    }
    elt.style.display = new_style
  }
}

// autoload
document.addEventListener(
  "DOMContentLoaded", () => {
    scale_options()
    new LiveMap().init()
    document.addEventListener(
      "keydown", (event) => {
        if (event.key === "a") {
          toggle_annotations()
        }
      })
  })
