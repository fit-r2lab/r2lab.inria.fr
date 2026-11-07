// -*- js-indent-level:4 -*-

/* for eslint */
/*global $*/

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/livetable.css")

import { node_distro, known_distros } from '/assets/r2lab/distros.js'
import { LiveColumnsNode, LiveColumns, livecolumns_options, span_html } from '/assets/r2lab/livecolumns.js'

////////// configurable
export let livetable_options = {

  // badges are built from known_distros in distros.js
  badge: (distro) => `<img src="/assets/img/${distro}-logo.${known_distros[distro]}">`,

}

//////////////////////////////
// nodes are dynamic
// their table row and cells get created through d3 enter mechanism
export class LiveTableNode extends LiveColumnsNode {

  constructor(id) {
    super(id)

    this.cells_data = [
      // each cell data can be either a couple (html + class) or a triple (add a tooltip)
      // see livecolumns for details
      [span_html(id, 'badge pointer'), ''], // id
      undefined,                              // avail
      undefined,                              // on/off
      undefined,                              // ping
      undefined,                              // ssh
      undefined,                              // data-interface
      undefined,                              // usrp-on-off
      undefined,                              // metal_info
      undefined,                              // docker_info
      [span_html(id, 'badge pointer'), ''], // id
    ]
  }


  // after the internal properties are updated from the incoming JSON message
  // we need to rewrite actual representation in cells_data
  // that will contain a list of ( html_text, class )
  // used by the d3 mechanism to update the <td> elements in the row
  compute_cells_data() {
    let col = 1
    // available
    this.cells_data[col++] = this.cell_available()
    // on/off
    this.cells_data[col++] = this.cell_on_off()
    // ping
    this.cells_data[col++] = this.cell_ping()
    // ssh
    this.cells_data[col++] = this.cell_ssh()
    // data-interface
    this.cells_data[col++] = this.cell_data_interface()
    // usrp
    this.cells_data[col++] = this.cell_sdr(true)
    // image name, OS, uname
    this.cells_data[col++] = this.cell_metal_info()
    // docker-ready, container running, image name...
    this.cells_data[col++] = this.cell_docker_info()
  }

  cell_ping() {
    return (this.control_ping == 'on')
      ? [span_html('', 'fa fa-link'), 'ok', 'ping OK']
      : [span_html('', 'fa fa-unlink'), 'ko', 'no ping']
  }

  cell_ssh() {
    return this.control_ssh == 'on'
      ? [span_html('', 'fa fa-circle'), 'ok', 'ssh OK']
      : [span_html('', 'far fa-circle'), 'ko', 'no ssh']

  }

  cell_metal_info() {
    let klass = 'metal'
    let reachable_ssh = this.control_ssh == 'on'
    klass += reachable_ssh ? ' ok' : ' ko'
    let uname = this.uname
    let os_release = this.os_release
    function tooltip(main) {
      let title = ""
      if (!reachable_ssh) title += `last seen:<br>`
      title += `uname=${uname}<br>`
      title += `os-release=${os_release}`
      return `<span data-toggle="tooltip" data-html="true" title="${title}">${main}</span>`
    }
    let distro = node_distro(this)
    if (distro == undefined)
      return ["n/a", klass]
    // always show the radical when we have it, even for unknown distros
    let label = this.image_radical || ((distro == 'other') ? `${os_release || '?'} (ssh OK)` : os_release)
    return [tooltip(`${livetable_options.badge(distro)} ${label}`), klass]
  }

  cell_docker_info() {
    // console.log(`${this.id} v=${this.docker_version} r=${this.container_running}`
    // `i=${this.container_image} s=${this.control_ssh}`)
    let klass = 'docker'
    let reachable_ssh = this.control_ssh == 'on'
    klass += reachable_ssh ? ' ok' : ' ko'
    klass += (this.docker_version && this.container_running == 'true') ? ' docker-ok' : ' docker-ko'
    let docker_version = this.docker_version
    let container_running = this.container_running
    function tooltip(main, title) {
      return `<span data-toggle="tooltip" data-html="true" title="${title}">${main}</span>`
    }
    function tooltip_details(main) {
      let title = ""
      if (!reachable_ssh) title += `last seen:<br>`
      title += `docker-version=${docker_version}<br>`
      title += `container-running=${container_running}`
      return tooltip(main, title)
    }
    if (!this.docker_version) {
      let title = ""
      title += "no docker found in image"
      return [tooltip('<span class="fa fa-times"></span>', title),
        klass]
    }
    if (this.container_running)
      klass += ' running'
    let display = this.container_image || '?'
    return [tooltip_details(display), klass]
  }
}

//////////////////////////////
export class LiveTable extends LiveColumns {

  constructor(domid) {
    super()
    this.domid = domid
  }


  init_headers(header) {
    header.append('th').html('#')
      .attr('data-toggle', 'tooltip').attr('title', 'node #')
    header.append('th').html('<span class="far fa-check-square"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'availability')
      .on('click', () => { d3.event.stopPropagation(); this.set_filter_mode('available')})
    header.append('th').html('<span class="fa fa-toggle-off"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'on/off')
      .on('click', () => { d3.event.stopPropagation(); this.set_filter_mode('cmc_on_off')})
    header.append('th').html('<span class="fa fa-link"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'ping')
      .on('click', () => { d3.event.stopPropagation(); this.set_filter_mode('control_ping')})
    header.append('th').html('<span class="far fa-circle"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'ssh')
      .on('click', () => { d3.event.stopPropagation(); this.set_filter_mode('control_ssh')})
    header.append('th').html('<span class="fas fa-align-justify"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'data interface')
    header.append('th').html('<span class="fas fa-wifi"></span>')
      .attr('data-toggle', 'tooltip').attr('title', 'sdr device')
    header.append('th').html('metal O.S.')
      .attr('data-toggle', 'tooltip').attr('data-html', 'true')
      .attr('title', '(ndz) image name<br>& details on the host OS')
    header.append('th').html('<span class="fab fa-docker"></span>')
      .attr('data-toggle', 'tooltip').attr('data-html', 'true')
      .attr('title', '(docker) image name<br>& other details on<br>the docker subsystem')
    header.append('th').html('#')
      .attr('data-toggle', 'tooltip').attr('title', 'node #')
  }

  init_nodes() {
    for (let i = 0; i < livecolumns_options.nb_nodes; i++) {
      this.nodes[i] = new LiveTableNode(i + 1)
    }
  }
}

////////// autoload
$(function () {
  // name it for debugging from the console
  let livetable = new LiveTable("livetable_container")
  livetable.init()
})
