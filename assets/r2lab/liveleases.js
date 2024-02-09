// -*- js-indent-level:4 -*-

/* for eslint */
/*global $ moment */
/*global r2lab_accounts*/

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/liveleases.css")

import { post_xhttp_django } from "/assets/r2lab/xhttp-django.js"

import { Sidecar } from "/assets/r2lab/sidecar.js"

import { PersistentSlices } from "/assets/r2lab/persistent-slices.js"

////////// provide for array.has()
if (!Array.prototype.has) {
  Array.prototype.has = function (needle) {
    return this.indexOf(needle >= 0)
  }
}

export let liveleases_options = {

  // set to 'book' for the BOOK page
  mode: 'run',

  debug: false,
}


function liveleases_debug(...args) {
  if (liveleases_options.debug)
    console.log(...args)
}


////////////////////////////////////////
// what we call **slots** are the events attached in the fullCalendar() plugin
// https://fullcalendar.io/docs/event_data/Event_Object/
// they are also called 'client events'
// https://fullcalendar.io/docs/event_data/clientEvents/
// they have
// (*) visible attributes like 'title', 'start' and 'end'
// (*) they also have a hidden 'id' field, that can be used to
// refer to them from the outside
////
// now the other way around, leases are managed in the API
// they have a slicename, and valid_from valid_until times
// and they have a uuid, that is the internal API lease_id
////
// refresh_from_api_leases's job is to reconcile
// (*) the currently displayed slots (displayed_slots),
// (*) with what comes in from the API (confirmed_slots)
//
// whenever a displayed_slot has a uuid, it is used to map it
// to the API (e.g. for tracking updates)
// when it's not the case, it is a newly created slot
// which has been displayed during the short amount of time
// when we're waiting for the API to confirm its creation
// for this we use the slot's id, that is just made of
// title + start + end
////

export class LiveLeases {

  constructor(domid, r2lab_accounts) {
    // this.domid is the id of the DOM element that serves
    // as the basis for fullCalendar
    // typically in our case liveleases_container
    this.domid = domid

    ////////////////////////////////////////
    this.persistent_slices = new PersistentSlices(r2lab_accounts, 'r2lab')

    this.dragging = false

    this.initial_duration = 60
    this.minimal_duration = 10

    this.textcolors = {
      regular: 'white',
      creating: 'black',
      editing: 'blue',
      deleting: 'red',
    }

  }

  // propagate fullCalendar call to the right jquery element
  fullCalendar(...args) {
    return $(`#${this.domid}`).fullCalendar(...args)
  }

  build_calendar() {
    /*let liveleases = this*/
    let today = moment().format("YYYY-MM-DD")
    let showAt = moment().subtract(1, 'hour').format("HH:mm")
    let run_mode = liveleases_options.mode == 'run'

    // the view types that are not read-only
    this.active_views = [
      'agendaDay', // run mode
      'agendaOneDay', 'agendaThreeDays', 'agendaWeek',
    ]

    // Create the calendar
    let calendar_args = {
      // all the other sizes are liveleases.css
      height: run_mode ? 480 : 762,
      // no header in run mode
      header:
        run_mode
          ? false
          : {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaZoom agendaOneDay,agendaThreeDays,agendaWeek,month listMonth,listYear',
          },

      views: {
        agendaZoom: {
          type: 'agenda',
          duration: { days: 1 },
          buttonText: 'zoom',
          // one slot = 10 minutes - that's what makes it a zoom
          slotDuration: '00:10:00',
        },
        agendaOneDay: {
          type: 'agenda',
          duration: { days: 1 },
          buttonText: 'day',
        },
        agendaThreeDays: {
          type: 'agenda',
          duration: { days: 3 },
          buttonText: '3 days'
        },
        agendaWeek: {
          type: 'agenda',
          duration: { days: 7 },
          buttonText: 'week'
        },
        month: {
          type: 'agenda',
          duration: { months: 1 },
          buttonText: 'month',
          selectable: false,
          editable: false,
          droppable: false,
          dblclick: false,
        },
        listMonth: {
          buttonText: 'list/month',
        },
        listYear: {
          buttonText: 'list/year',
        },
      },

      defaultView: run_mode ? 'agendaDay' : 'agendaZoom',

      ////////////////////
      slotDuration: "01:00:00", // except for agendaZoom
      snapDuration: "00:10:00",
      snapMinutes: 10,
      forceEventDuration: true,
      timezone: 'local',
      locale: 'en',
      timeFormat: 'H(:mm)',
      slotLabelFormat: 'H(:mm)',
      defaultDate: today,
      selectHelper: false,
      overlap: false,
      eventOverlap: false,
      selectOverlap: false,
      selectable: true,
      editable: true,
      allDaySlot: false,
      droppable: true,
      nowIndicator: true,
      scrollTime: showAt,

      // events from Json file
      events: [],
    }
    calendar_args = this.decorate_with_callbacks(calendar_args)

    this.fullCalendar(calendar_args)
  }

  // the callback machinery
  // all the methods in LiveLeases whose names start with 'callback_'
  // get attached to the corresponding fullCalendar callback
  // e.g.
  // because we had defined callback_select,
  // calendar_args will contain a 'select' entry
  // that will redirect to invoking callback_select on
  // the liveleases object
  // for an example with more words:
  // our method callback_event_render becomes eventRender
  //
  // so e.g. a selection event in fullCalendar
  // triggers select(start, end, jsEvent, view)
  // which results in liveleases.callback_select(thisdom, start, end, jsEvent, view)
  // in which thisdom is the 'this' passed to the callback, a DOM element in most cases
  //
  // for details on suported callbacks see
  // https://fullcalendar.io/docs/

  decorate_with_callbacks(calendar_args) {
    let liveleases = this

    // callback typically is callback_event_render
    let decorator = function (callback) {
      let wrapped = function (...args) {
        // always pass 'this' as a first *arg* to the method
        // call, since otherwise 'this' in that context will
        // be liveleases
        let dom = this
        return liveleases[callback](dom, ...args)
      }
      return wrapped
    }

    // dude -> Dude
    function title_case(x) {
      return x[0].toUpperCase() + x.slice(1)
    }
    // transform callback_some_thing into someThing
    function fullcalendar_name(our_name) {
      let pieces = our_name.split('_')
      // drop initial 'callback'
      pieces.shift()
      // start with the first part
      let result = pieces.shift()
      // if there are more
      for (let piece of pieces)
        result += title_case(piece)
      return result
    }

    let callbacks = Object.getOwnPropertyNames(
      liveleases.__proto__)
      .filter(function (prop) {
        return ((typeof liveleases[prop] == 'function')
          && prop.startsWith('callback_'))
      })

    for (let callback of callbacks) {
      calendar_args[fullcalendar_name(callback)] = decorator(callback)
    }
    return calendar_args
  }

  ////////////////////
  // convenience
  is_readonly_view() {
    let view = this.fullCalendar('getView').type
    if (!this.active_views.has(view)) {
      this.show_message(`view ${view} is read only`)
      return true
    }
  }


  show_message(msg, type) {
    let cls = 'danger'
    let title = 'Ooops!'
    if (type == 'info') {
      cls = 'info'
      title = 'Info:'
    }
    if (type == 'success') {
      cls = 'success'
      title = 'Yep!'
    }
    $('html,body').animate({ 'scrollTop': 0 }, 400)
    $('#messages').removeClass().addClass(`alert alert-${cls}`)
    $('#messages').html(`<strong>${title}</strong> ${msg}`)
    $('#messages').fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200)
    $('#messages').delay(20000).fadeOut()
  }


  //////////////////// creation
  // helper
  popover_content(slot) {
    let hh_mm = function (date) {
      return moment(date).format("HH:mm")
    }
    return `${hh_mm(slot.start._d)}-${hh_mm(slot.end._d)}`
  }

  callback_event_render(dom, slot, element/*, view*/) {
    $(element).popover({
      title: slot.title,
      content: this.popover_content(slot),
      html: true,
      placement: 'auto',
      trigger: 'hover',
      delay: { "show": 500 }
    })
  }


  callback_event_after_render(dom, slot, element/*, view*/) {
    let liveleases = this

    // adjust editable each time a change occurs
    slot.editable =
      (this.is_my_slice(slot.title) && (!this.is_past_date(slot.end)))
    if (slot.editable) {
      // arm callback for deletion
      let delete_slot = function () {
        element.find(".delete-slot").tooltip('dispose')
        liveleases.remove_slot(slot, element)
      }
      // on double click
      element.bind('dblclick', delete_slot)
      // add X button
      let help = "delete this slot<br/>"
        + "double clicking a slot<br/>"
        + "deletes it too"
      element.find(".fc-content")
        .append(`<div class='delete-slot fa fa-remove'>`)
      element.find(".delete-slot")
        .on('click', delete_slot)
        .tooltip({ title: help, html: true })
    }
    // cannot do something like fullCalendar('updateEvent', slot)
    // that would cause an infinite loop
  }

  // click in the calendar - requires a current slice
  callback_select(dom, start, end/*, jsEvent, view*/) {
    liveleases_debug(`start ${start} - end ${end}`)

    let current_title = this.get_current_slice_name()
    if (!current_title) {
      this.show_message("No selected slice..")
      return
    }

    if (this.is_past_date(end)) {
      this.fullCalendar('unselect')
      this.show_message('This timeslot is in the past!')
      return
    }

    [start, end] = this.adapt_start_end(start, end)

    let slot = {
      title: this.pending_name(current_title),
      start: start,
      end: end,
      overlap: false,
      editable: false,
      selectable: false,
      color: this.get_current_slice_color(),
      textColor: this.textcolors.creating,
      // note that this id really is used only until
      // the lease comes back from the API
      // so there is no need to maintain it later on
      id: this.slot_id(current_title, start, end),
    }
    this.send_api('add', slot)
    this.fullCalendar('renderEvent', slot, true)
    this.fullCalendar('unselect')
  }


  // dropping a slice into the calendar
  callback_drop(dom, date/*, jsEvent, ui, resourceId*/) {

    this.adopt_current_slice($(dom))
    let current_title = this.get_current_slice_name()

    let start = date
    let end = moment(date).add(this.initial_duration, 'minutes')
    if (this.is_past_date(end)) {
      this.fullCalendar('unselect')
      this.show_message('This timeslot is in the past!')
      return false
    }

    [start, end] = this.adapt_start_end(start, end)
    let slot = {
      title: this.pending_name(current_title),
      start: start,
      end: end,
      overlap: false,
      editable: false,
      selectable: false,
      color: this.get_current_slice_color(),
      textColor: this.textcolors.creating,
      // note that this id really is used only until
      // the lease comes back from the API
      // so there is no need to maintain it later on
      id: this.slot_id(current_title, start, end),
    }
    this.send_api('add', slot)
    this.fullCalendar('renderEvent', slot, true)
    this.fullCalendar('unselect')
  }


  // dragging a slot from one place to another
  callback_event_drop(dom, slot, delta, revertFunc/*, jsEvent, ui, view*/) {
    liveleases_debug(`eventDrop`, slot, delta)
    $(dom).popover('hide')
    if (this.is_readonly_view()) {
      revertFunc()
      return
    }
    if (this.is_past_date(slot.end)) {
      this.show_message('This timeslot is in the past!')
      revertFunc()
      return
    }
    if (!confirm("Confirm this change ?")) {
      revertFunc()
      return
    }
    this.send_api('update', slot)
    slot.title = this.pending_name(slot.title)
    slot.textColor = this.textcolors.editing
    this.fullCalendar('updateEvent', slot)
  }

  // when removing a lease
  // if it's entirely in the past : refuse to remove
  // if it's entirely in the future : delete completely
  // if in the middle : then we want to
  // (*) free the testbed immediately
  // (*) but still keep track of that activity
  // so we try to resize the slot so that it remains in the history
  // but still is out of the way
  remove_slot(slot/*, element*/) {
    if (this.is_readonly_view()) {
      return
    }
    // can only remove my slices
    if (!this.is_my_slice(slot.title))
      return
    // ignore leases in the past no matter what
    if (this.is_past_date(slot.end)) {
      this.show_message("This lease is in the past !")
    }

    // this is editable, let's confirm
    if (!confirm("Confirm removing?"))
      return

    slot.title = this.removing_name(slot.title)
    slot.textColor = this.textcolors.deleting
    slot.selectable = false
    // how many minutes has it been running
    let started = moment().diff(moment(slot.start), 'minutes')
    if (started >= this.minimal_duration) {
      // this is the case where we can just shrink it
      let rounded = started - (started % this.minimal_duration)
      liveleases_debug(`up ${started} mn : delete slot by shrinking it down by ${rounded} mn`)
      // set end to now and, let the API round it
      liveleases_debug('before', slot)
      slot.end = moment(slot.start).add(rounded, 'minutes')
      liveleases_debug('after', slot)
      this.send_api('update', slot)
      this.fullCalendar('updateEvent', slot)
    } else {
      // either it's in the future completely, or has run for too
      // short a time that we can keep it, so delete altogether
      liveleases_debug(`up ${started} mn : delete slot completely`)
      this.send_api('delete', slot)
      this.fullCalendar('updateEvent', slot)
    }
  }


  callback_event_resize(dom, slot, delta, revertFunc, jsEvent/*, ui, view*/) {
    liveleases_debug(`resize`, slot, delta, jsEvent)
    if (!this.is_my_slice(slot.title)) {
      // should not happen..
      this.show_message("Not owner")
      return
    }
    if (!confirm("Confirm this change?")) {
      revertFunc()
      return
    }
    this.send_api('update', slot)
    slot.title = this.pending_name(slot.title)
    slot.textColor = this.textcolors.editing
    this.fullCalendar('updateEvent', slot)
  }


  // minor callbacks
  callback_event_drag_start(/*dom, event, jsEvent, ui, view*/) {
    this.dragging = true
  }
  callback_event_drag_stop(/*dom, event, jsEvent, ui, view*/) {
    this.dragging = false
  }
  callback_event_mouseout(dom/*, event, jsEvent, view*/) {
    $(dom).popover('hide')
  }

  //////////
  slice_element_id(id) {
    return id.replace(/\./g, '')
  }

  // make this the new current slice from a jquery element
  // associated to the clicked slice on the LHS
  adopt_current_slice(slice_element) {
    let title = $.trim(slice_element.text())
    this.persistent_slices.set_current(title)
    this.outline_current_slice(title)
  }


  outline_current_slice(name) {
    let id = this.slice_element_id(name)
    $(".noactive").removeClass('slice-active')
    $(`#${id}`).addClass('slice-active')
  }


  get_current_slice_name() {
    return this.persistent_slices.get_current_slice_name()
  }
  get_current_slice_color() {
    return this.persistent_slices.get_current_slice_color()
  }
  get_my_slices_names() {
    return this.persistent_slices.my_slices_names()
  }
  get_slice_color(slicename) {
    return this.persistent_slices.get_slice_color(slicename)
  }
  short_slice_name(name) {
    let new_name = name
    new_name = name.replace('onelab.', '')
    return new_name
  }
  is_my_slice(slicename) {
    let pslice = this.persistent_slices.record_slice(slicename)
    return pslice.mine
  }

  ////////////////////
  is_past_date(end) { return (moment().diff(end, 'minutes') > 0) }
  pending_name(name) { return `${this.reset_name(name)} (pending)` }
  removing_name(name) { return `${this.reset_name(name)} (removing)` }
  reset_name(name) {
    return name
      .replace(' (pending)', '')
      .replace(' (removing)', '')
  }
  slot_id(title, start, end) {
    let m_start = moment(start)._d.toISOString()
    let m_end = moment(end)._d.toISOString()
    return `${title}-from-${m_start}-until-${m_end}`
  }

  ////////////////////
  adapt_start_end(start, end) {
    let now = new Date()
    let started = moment(now).diff(moment(start), 'minutes')
    if (started > 0) {
      let s = moment(now).diff(moment(start), 'minutes')
      let ns = moment(start).add(s, 'minutes')
      start = ns
      //end = moment(end).add(1, 'hour')
    }
    // round to not wait
    start = moment(start).floor(this.minimal_duration, 'minutes')
    return [start, end]
  }


  // go as deep as possible in an object
  // typically used to get the meaningful part in an error object
  dig_xpath(obj, xpath) {
    let result = obj
    for (let attr of xpath) {
      if ((typeof result == 'object') && (attr in result)) {
        result = result[attr]
      } else {
        break
      }
    }
    return result
  }

  send_api(verb, slot) {
    liveleases_debug("send_api", verb, slot)
    let liveleases = this
    let request = null

    if (verb == 'add') {
      request = {
        "slicename": this.reset_name(slot.title),
        "valid_from": slot.start._d.toISOString(),
        "valid_until": slot.end._d.toISOString()
      }
    } else if (verb == 'update') {
      request = {
        "uuid": slot.uuid,
        "valid_from": slot.start._d.toISOString(),
        "valid_until": slot.end._d.toISOString()
      }
    } else if (verb == 'delete') {
      request = {
        "uuid": slot.uuid,
      }
    } else {
      liveleases_debug(`send_api : Unknown verb ${verb}`)
      return false
    }
    liveleases_debug('send_api ->', request)
    post_xhttp_django(`/leases/${verb}`, request, function (xhttp) {
      if (xhttp.readyState == 4) {
        // this triggers a refresh of the leases once the sidecar server answers back
        liveleases.request_update_from_api()
        ////////// temporary
        // in all cases, show the results in console, in case we'd need to improve this
        // logic further on in the future
        liveleases_debug(`upon ajax POST: xhttp.status = ${xhttp.status}`)
        ////////// what should remain
        if (xhttp.status != 200) {
          // this typically is a 500 error inside django
          // hard to know what to expect..
          liveleases.show_message(`Something went wrong when managing leases with code ${xhttp.status}`)
        } else {
          // the http POST has been successful, but a lot can happen still
          // for starters, are we getting a JSON string ?
          try {
            let obj = JSON.parse(xhttp.responseText)
            if (obj.error) {
              liveleases.show_message(
                liveleases.dig_xpath(obj, ['error', 'exception', 'reason']))
            } else {
              liveleases_debug("JSON.parse ->", obj)
            }
          } catch (err) {
            liveleases.show_message(`unexpected error while anayzing django answer ${err}`)
            console.log(err.stack)
          }
        }
      }
    })
  }


  // incoming is an array of pslices as defined in
  // persistent_slices.js
  build_slices_box() {

    let liveleases = this
    liveleases_debug('build_slices_box')
    let pslices = this.persistent_slices.pslices

    for (let pslice of pslices) {
      // show only slices that are mine
      if (!pslice.mine)
        continue
      // need to run short_slice_name ?
      let name = pslice.name
      let handle = `handle-${name}`
      let color = pslice.color
      let help = "drag in timeline</br>to create a reservation"
      $("#my-slices")
        .append(
          $("<div />")
            .addClass('fc-event')
            .attr("style", `background-color: ${color}`)
            .attr("id", handle)
            .text(name))
        .append(
          $("<div />")
            .attr("id", liveleases.slice_element_id(name))
            .addClass('noactive'))
      $(`#${handle}`).tooltip(
        {
          title: help,
          placement: 'left',
          delay: 1200,
          html: true
        })
    }
    $('#my-slices .fc-event').each(function () {
      $(this).draggable({
        zIndex: 999,
        revert: true,
        revertDuration: 0
      })
    })
    $("#liveleases_reset_colors").on('click', function () {
      liveleases.persistent_slices._clear()
      alert("Colors have been reset, page will now be reloaded")
      location.reload()
    })
  }

  // triggered when a new message comes from the API
  // refresh calendar from that data
  refresh_from_api_leases(confirmed_slots) {
    liveleases_debug(`refresh_from_api_leases with ${confirmed_slots.length} API leases`)
    // not while dragging
    if (this.dragging)
      return

    ////////// compute difference between displayed and confirmed slots
    // gather all slots currently displayed
    let displayed_slots = this.fullCalendar('clientEvents')

    // initialize
    for (let displayed_slot of displayed_slots)
      displayed_slot.confirmed = false
    for (let confirmed_slot of confirmed_slots)
      confirmed_slot.displayed = false

    // scan all confirmed
    for (let confirmed_slot of confirmed_slots) {
      let confirmed_id = this.slot_id(confirmed_slot.title,
        confirmed_slot.start,
        confirmed_slot.end)
      // scan all displayed
      for (let displayed_slot of displayed_slots) {
        // already paired visual slots can be ignored
        if (displayed_slot.confirmed)
          continue
        //liveleases_debug(`matching CONFIRMED ${confirmed_slot.title} ${confirmed_slot.uuid}`
        //                 + ` with displayed ${displayed_slot.title}`)
        let match = (displayed_slot.uuid)
          ? (confirmed_slot.uuid == displayed_slot.uuid)
          : (confirmed_id == displayed_slot.id)

        if (match) {
          //liveleases_debug(`MATCH`)
          // update displayed from confirmed
          displayed_slot.uuid = confirmed_slot.uuid
          displayed_slot.title = confirmed_slot.title
          displayed_slot.start = moment(confirmed_slot.start)
          displayed_slot.end = moment(confirmed_slot.end)
          displayed_slot.textColor = this.textcolors.regular
          // mark both as matched
          displayed_slot.confirmed = true
          confirmed_slot.displayed = true
          continue
        }
      }
    }

    // note that removing obsolete slots here instead of later
    // was causing weird issues with fullCalendar

    // update all slots, in case their title/start/end/colors have changed
    let slots = this.fullCalendar('clientEvents')
    liveleases_debug(`refreshing ${slots.length} slots`)
    this.fullCalendar('updateEvents', slots)

    // remove displayed slots that are no longer relevant
    this.fullCalendar('removeEvents', slot => !slot.confirmed)

    // create slots in calendar for confirmed slots not yet displayed
    // typically useful at startup, and for stuff  created by someone else
    let new_slots = confirmed_slots.filter(slot => !slot.displayed)
    liveleases_debug(`creating ${new_slots.length} slots`)
    this.fullCalendar('renderEvents', new_slots, true)
  }


  // use this to ask for an immediate refresh
  // of the set of leases
  // of course it must be called *after* the actual API call
  // via django
  request_update_from_api() {
    liveleases_debug(`requesting leases`)
    this.sidecar.request('leases')
  }


  leases_callback(leases) {
    let api_slots = this.parse_leases(leases)
    liveleases_debug(`incoming ${api_slots.length} leases`)
    this.refresh_from_api_leases(api_slots)
    this.outline_current_slice(this.get_current_slice_name())
  }


  // transform API leases from JSON into an object,
  // and then into fc-friendly slots
  parse_leases(leases) {
    let liveleases = this
    liveleases_debug("parse_leases", leases)

    return leases.map(function (lease) {
      let title = liveleases.short_slice_name(lease.slicename)
      let start = lease.valid_from
      let end = lease.valid_until
      // remember that slice
      liveleases.persistent_slices.record_slice(title)

      return {
        title: title,
        uuid: String(lease.uuid),
        start: start,
        end: end,
        id: liveleases.slot_id(title, start, end),
        color: liveleases.get_slice_color(title),
        overlap: false
      }
    })
  }


  init_sidecar() {
    let callbacks_map = {
      leases: (leases) => this.leases_callback(leases)
    }
    let categories = ['leases']

    // this actually is a singleton
    this.sidecar = Sidecar()
    this.sidecar.register_callbacks_map(callbacks_map)
    this.sidecar.register_categories(categories)
    this.sidecar.open()

  }

  ////////////////////////////////////////
  main() {

    this.build_slices_box()
    this.build_calendar()
    this.outline_current_slice(this.get_current_slice_name())

    let run_mode = liveleases_options.mode == 'run'
    if (run_mode) {
      // don't do this in book mode, it would change all days
      $('.fc-day-header').html('today')
    }

    let liveleases = this
    let slices = $('#my-slices .fc-event')
    slices.dblclick(function () {
      liveleases.adopt_current_slice($(this))
    })

    $('body').on('click', 'button.fc-month-button', function () {
      liveleases.show_message('This view is read only!', 'info')
    })

    this.init_sidecar()
  }
}


$(function () {
  let liveleases = new LiveLeases('liveleases_container', r2lab_accounts)
  liveleases.main()
})
