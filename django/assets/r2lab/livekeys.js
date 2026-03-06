// -*- js-indent-level:4 -*-

/* for eslint */
/*global $ */

"use strict"

import { load_css } from "/assets/r2lab/load-css.js"
load_css("/assets/r2lab/livekeys.css")

import { r2labapi } from "/assets/r2lab/r2labapi.js"

/* would need something cleaner .. */
$(function () {

  let display_keys = async function (domid) {
    let keysdiv = $("#" + domid)
    // create 1 div for the list of keys, and one for the add-key button
    let id_list = `keyslist-${domid}`
    let id_add = `keyadd-${domid}`
    keysdiv.html(`<div id="${id_list}">`)
    keysdiv.append(`<div id="${id_add}">`)
    let div_list = $(`#${id_list}`)
    let div_add = $(`#${id_add}`)
    // header for the list of keys
    div_list.append(
      "<div class='row key-header'>"
      + "<div class='col-md-10'>Public Key</div>"
      + "<div class='col-md-2'>&nbsp;</div>"
      + "</div>")
    div_add.html(
      "<div class='row'>"
      + "<div class='col-md-12 add-key-area'>"
      + "<label class='btn btn-primary' for='key-file-selector'>"
      + "<input id='key-file-selector' type='file' style='display:none;'>"
      + "Select public key file to add"
      + "</label>"
      + "</div>"
      + "</div>")
    document.getElementById('key-file-selector')
      .addEventListener('change', add_key_from_file, false)
    $('.add-key-area').tooltip(
      { title: 'Click to upload another public key' })

    try {
      let me = await r2labapi('GET', 'users/me')
      let keys = await r2labapi('GET', `users/${me.id}/keys`)
      if (keys.length) {
        keys.forEach(function (key) {
          let ssh_key = key['key']
          let key_id = key['id']
          let delete_id = `delete-key-${key_id}`
          let delete_button =
            `<span class="fa fa-remove in-red" id="${delete_id}"></span>`
          div_list.append(
            `<div class="row">`
            + `<div class="col-md-10 key-detail">${ssh_key}</div>`
            + `<div class="col-md-2">${delete_button}</div>`
            + "</div>")
          $(`#${delete_id}`).click(function () { delete_key(key_id) })
          $(`#${delete_id}`).tooltip({ title: `delete key ${key_id}` })
        })
      } else {
        div_list.append(
          `<div class="row in-red">You have no known key yet, please upload one !</div>`)
      }
    } catch (err) {
      div_list.append(
        `<div class="row in-red">Could not fetch keys: ${err.message}</div>`)
    }
  }


  let delete_key = async function (key_id) {
    if (!confirm(`Delete key ${key_id}?`))
      return
    try {
      let me = await r2labapi('GET', 'users/me')
      await r2labapi('DELETE', `users/${me.id}/keys/${key_id}`)
      display_keys("livekeys-container")
    } catch (err) {
      console.log("delete key failed", err)
    }
  }


  let add_key_from_file = function (e) {
    let file = e.target.files[0]
    if (!file) {
      console.log("add_key_from_file - missed")
      return
    }
    let reader = new FileReader()
    reader.onload = function (e) {
      let key = e.target.result
      add_key(key)
    }
    reader.readAsText(file)
  }


  let add_key = async function (key) {
    try {
      let me = await r2labapi('GET', 'users/me')
      await r2labapi('POST', `users/${me.id}/keys`, {body: {key: key}})
      display_keys("livekeys-container")
    } catch (err) {
      console.log("add key failed", err)
    }
  }

  function main() {
    display_keys("livekeys-container")
  }

  main()
})
