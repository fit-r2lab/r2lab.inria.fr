// -*- js-indent-level:4 -*-

/* for eslint */
/*global $  moment*/
/*global r2lab_accounts */

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/liveslices.css")

import { post_xhttp_django } from "/assets/r2lab/xhttp-django.js"

$(function () {

  function normalize_id(name) {
    let new_name = name
    new_name = name.replace(/[_\s]/g, '-').replace(/[^a-z0-9-\s]/gi, '')
    return new_name
  }


  function send_message(msg, type) {
    let cls = 'danger'
    let title = 'Ooops!'
    if (type == 'info') {
      cls = 'info'
      title = 'Info:'
    }
    if (type == 'attention') {
      cls = 'warning'
      title = 'Attention:'
    }
    if (type == 'success') {
      cls = 'success'
      title = 'Yep!'
    }
    $('html,body').animate({ 'scrollTop': 0 }, 400)
    $('#messages').removeClass().addClass(`alert alert-${cls}`)
    $('#messages').html(`<strong>${title}</strong> ${msg}`)
    $('#messages').fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200)
  }


  function is_past_date(date) {
    let past = false
    if (moment().diff(date, 'minutes') > 0 && date != null) {
      past = true
    }
    return past
  }


  let get_slices = function (id, names) {
    let body = $(`#${id}`)
    body.html(
      "<div class='row slice-header'>"
      + "<div class='col-md-6'>Name</div>"
      + "<div class='col-md-4'>Expiration Date</div>"
      + "<div class='col-md-2'>Renew</div>"
      + "</div>")
    $.each(names, function (index, value) {

      let request = {}
      request['names'] = [value]

      post_xhttp_django('/slices/get', request, function (xhttp) {

        if (!(xhttp.readyState == 4 && xhttp.status == 200))
          return
        let responses = JSON.parse(xhttp.responseText)
        if (responses.length <= 0)
          return

        let slice_manage_invitation = '\
One or more of your slices has expired. \
<a href="#" data-toggle="modal" data-target="#slices_keys_modal">\
Click here to renew it!</a>'
        for (let i = 0; i < responses.length; i++) {

          let response = responses[i]
          let slicename = response['name']
          let normal_id = normalize_id(slicename)
          let expiration = response['valid_until']
          let closed = response['closed_at']
          //let expiration = '2016-01-22T09:25:31Z'

          let s_class = 'in-green'
          let s_id = `renew-slice-${normal_id}`
          let s_icon = `<span class='fa fa-refresh in-blue' id='${s_id}'>`
          let the_date = moment(expiration).format("YYYY-MM-DD HH:mm")
          if (is_past_date(expiration) || is_past_date(closed)) {
            send_message(slice_manage_invitation, 'attention')

            if (is_past_date(closed)) {
              the_date = moment(closed).format("YYYY-MM-DD HH:mm")
            }

            s_class = 'in-red'
          }

          $(body).append(
            `<div class='row'>`
            + `<div class='col-md-6'>${slicename}</div>`
            + `<div class='col-md-4' id='timestamp-expire${normal_id}'>`
            + `<span class='${s_class}'>${the_date}</span>`
            + `</div>`
            + `<div class='col-md-2'>${s_icon}</div>`)
          $(`#${s_id}`).click(function () {
            renew_slice(normalize_id(slicename), slicename)
          })
        }
      })
    })
  }


  let renew_slice = function (element, slicename) {
    let request = {
      "name": slicename,
    }
    post_xhttp_django('/slices/renew', request, function (xhttp) {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        let answer = JSON.parse(xhttp.responseText)
        // console.log("answer from /slices/renew")
        // console.log(answer)

        $('#timestamp-expire' + element).removeClass('in-red')
        $('#timestamp-expire' + element).addClass('in-green')
        $('#timestamp-expire' + element).toggle("pulsate").toggle("highlight")
        $('#timestamp-expire' + element).html(moment(answer['valid_until']).format("YYYY-MM-DD HH:mm"))
      }
    })
  }


  function main() {
    let slicenames = r2lab_accounts.map(
      function (account) { return account['name'] })
    get_slices("liveslices-container", slicenames)
  }


  main()
})
