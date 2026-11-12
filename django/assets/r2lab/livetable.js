// -*- js-indent-level:4 -*-

/* for eslint */
/*global $*/

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/livetable.css")

import { node_distro, metal_distro, container_distro, metal_is_live, known_distros } from '/assets/r2lab/distros.js'
import { LiveColumnsNode, LiveColumns, livecolumns_options, span_html } from '/assets/r2lab/livecolumns.js'

////////// configurable
export let livetable_options = {

  // badges are built from known_distros in distros.js
  badge: (distro) => `<img style="height:20px" src="/assets/img/${distro}-logo.${known_distros[distro]}">`,

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
    // not an ssh matter: the node is running the image loader or saver
    if (this.state == 'telnet')
      return [span_html('', 'fa fa-terminal'), 'ko', 'telnet - an image is being loaded or saved']
    return this.control_ssh == 'on'
      ? [span_html('', 'fa fa-circle'), 'ok', 'ssh OK']
      : [span_html('', 'far fa-circle'), 'ko', 'no ssh']

  }

  cell_metal_info() {
    // data from a monitor that sends the metal and container sub-records
    return this.metal ? this.cell_metal_info_records() : this.cell_metal_info_flat()
  }

  cell_docker_info() {
    return this.metal ? this.cell_docker_info_records() : this.cell_docker_info_flat()
  }

  // used for tooltips: how long ago was that, from an epoch in seconds
  static ago(seen) {
    if (!seen) return undefined
    const seconds = Math.max(0, Math.round(Date.now() / 1000 - seen))
    if (seconds < 90) return 'just now'
    const minutes = Math.round(seconds / 60)
    if (minutes < 90) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 36) return `${hours} h ago`
    return `${Math.round(hours / 24)} days ago`
  }

  // with metal / container: what is on the node, and when it was last seen
  // when the node cannot be reached, this is what was there the last time
  cell_metal_info_records() {
    const { metal } = this
    let klass = 'metal'
    const reachable = metal_is_live(this)
    klass += reachable ? ' ok' : ' ko'
    const distro = metal_distro(this)
    if (distro == undefined)
      return ["n/a", klass]
    let title = ""
    if (!reachable) title += `last seen ${LiveTableNode.ago(metal.seen) || '?'}:<br>`
    if (metal.pretty_name) title += `${metal.pretty_name}<br>`
    title += `uname=${metal.uname}<br>`
    title += `os-release=${metal.os_release}<br>`
    if (metal.docker_version) title += `docker-version=${metal.docker_version}<br>`
    title += `ssh port=${metal.ssh_port}`
    const label = metal.image_radical
      || ((distro == 'other') ? `${metal.os_release || '?'} (ssh OK)` : metal.os_release)
    // with docker on, the metal is shown with the docker logo;
    // the container's distro logo goes in the docker column
    const badge = metal.docker_version
      ? '<span class="fab fa-docker"></span>'
      : livetable_options.badge(distro)
    return [`<span data-toggle="tooltip" data-html="true" title="${title}">${badge} ${label}</span>`, klass]
  }

  cell_docker_info_records() {
    const { metal, container } = this
    let klass = 'docker'
    const reachable = metal_is_live(this)
    klass += reachable ? ' ok' : ' ko'
    const tooltip = (main, title) =>
      `<span data-toggle="tooltip" data-html="true" title="${title}">${main}</span>`
    if (!metal.docker_version) {
      klass += ' docker-ko'
      return [tooltip('<span class="fa fa-times"></span>', "no docker found in image"), klass]
    }
    let title = ""
    if (!reachable) title += `last seen ${LiveTableNode.ago((container || metal).seen) || '?'}:<br>`
    if (!container) {
      klass += ' docker-ko stopped'
      title += "no container"
      return [tooltip('no container', title), klass]
    }
    klass += container.running ? ' docker-ok running' : ' docker-ko stopped'
    title += `container-running=${container.running}<br>`
    if (container.pretty_name) title += `${container.pretty_name}<br>`
    // docker gives e.g. 2026-11-07T09:12:01.123456789Z : drop the fraction of a second
    if (container.started) title += `started ${container.started.replace(/\.\d+(?=Z|[+-]\d\d:?\d\d$)/, '')}`
    // a container that is not (yet) known to us, e.g. not running, still gets a logo
    // the container's own distro is only visible through its sshd, so unknown
    // when it is stopped; then show what the map shows for that node
    const distro = container_distro(this) || node_distro(this) || 'other'
    const badge = `${livetable_options.badge(distro)} `
    return [tooltip(`${badge}${container.image || '?'}`, title), klass]
  }

  // from the flat keys only, with data from a monitor that predates the
  // metal and container sub-records
  cell_metal_info_flat() {
    let klass = 'metal'
    let reachable_ssh = this.control_ssh == 'on'
    klass += reachable_ssh ? ' ok' : ' ko'
    let uname = this.uname
    let os_release = this.os_release
    let docker_version = this.docker_version
    function tooltip(main) {
      let title = ""
      if (!reachable_ssh) title += `last seen:<br>`
      title += `uname=${uname}<br>`
      title += `os-release=${os_release}`
      if (docker_version) title += `<br>docker-version=${docker_version}`
      return `<span data-toggle="tooltip" data-html="true" title="${title}">${main}</span>`
    }
    let distro = node_distro(this)
    if (distro == undefined)
      return ["n/a", klass]
    // always show the radical when we have it, even for unknown distros
    let label = this.image_radical || ((distro == 'other') ? `${os_release || '?'} (ssh OK)` : os_release)
    // with docker on, the metal is shown with the docker logo;
    // the container's distro logo goes in the docker column
    let badge = this.docker_version
      ? '<span class="fab fa-docker"></span>'
      : livetable_options.badge(distro)
    return [tooltip(`${badge} ${label}`), klass]
  }

  cell_docker_info_flat() {
    // console.log(`${this.id} v=${this.docker_version} r=${this.container_running}`
    // `i=${this.container_image} s=${this.control_ssh}`)
    let klass = 'docker'
    let reachable_ssh = this.control_ssh == 'on'
    klass += reachable_ssh ? ' ok' : ' ko'
    klass += (this.docker_version && this.container_running == 'true') ? ' docker-ok' : ' docker-ko'
    // a container that is not running is shown half transparent
    if (this.docker_version && this.container_running != 'true')
      klass += ' stopped'
    let docker_version = this.docker_version
    let container_running = this.container_running
    function tooltip(main, title) {
      return `<span data-toggle="tooltip" data-html="true" title="${title}">${main}</span>`
    }
    function tooltip_details(main) {
      let title = ""
      if (!reachable_ssh) title += `last seen:<br>`
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
    let distro = node_distro(this)
    let badge = distro ? `${livetable_options.badge(distro)} ` : ''
    let display = `${badge}${this.container_image || '?'}`
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
