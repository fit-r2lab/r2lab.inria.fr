/*
 * this hook is designed to fire at load-time
 * and to set one tab as active in the header
 *
 * the logic here is quite simple
 * page.html generates as many tabs as are likely to be active
 * (as of now, these will be 3 : overview, tutorials and status)
 * each comes with these 2 attributes set
 * id="tab-status"  (fixed in page.html)
 * tab="{{tab}}" - as per the page's metadata,
 * that is to say a line in the header that says tab:tutorials
 *
 * so all that is left to do here is to set class 'active' on elements
 * (*) that have an id of the form
 *    id == tab-<foo>
 * (*) and that have
 *    tab == foo
 *
 */

/* for eslint */
/*global $ */

$(function () {
  $("a[tab]").map(function () {
    let $this = $(this)
    if (`tab-${$this.attr('tab')}` == this.id)
      $this.addClass('current')
  })
})
