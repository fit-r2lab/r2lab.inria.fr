// -*- js-indent-level:4 -*-

/* for eslint */
/*global $*/

"use strict"

//from https://docs.djangoproject.com/en/1.9/ref/csrf/
function getCookie(name) {
  var cookieValue = null
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';')
    for (var i = 0; i < cookies.length; i++) {
      var cookie = $.trim(cookies[i])
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// callback will be called on the xhttp object upon ready state change
// see http://www.w3schools.com/ajax/ajax_xmlhttprequest_onreadystatechange.asp
// urlpath being for example "/slices/get" or similar
export function post_xhttp_django(urlpath, request, callback) {
  var xhttp = new XMLHttpRequest()
  xhttp.open("POST", urlpath, true)
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  // this is where we retrieve the CSRF token from the context
  var csrftoken = getCookie('csrftoken')
  xhttp.setRequestHeader("X-CSRFToken", csrftoken)
  xhttp.send(JSON.stringify(request))
  xhttp.onreadystatechange = function () { callback(xhttp) }
}
