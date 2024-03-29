/*
 * tools for managing current slice
 */
"use strict"

/* for eslint */
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "PersistentSlices" }]*/


////////// provide for array.first()
if (!Array.prototype.first) {
  Array.prototype.first = function () {
    return this[0]
  }
}

/*
 * color generation based stolen from
 */

// XXX need to add hard-wiring of a color for the nightly slice
class ColorsGenerator {

  constructor(category) {
    // capture incoming parameter
    this.category = category

    // hard-wire special cases
    this.hard_wired = {
      'inria_r2lab.nightly': 'black',
      'inria_admin': 'red',
    }

    // special colors
    this.foreign_color = "#999"
    this.overflow_color = "#558"

    ////////////////////
    this.categories = {
      rainbow: [
        'red', 'orange', 'yellow', 'green', 'blue', 'purple',
      ],
      qualitative: [
        '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
        '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f',
      ],
      quantitative: [
        '#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59',
        '#ef6548', '#d7301f', '#b30000', '#7f0000',
      ],
      divergent: [
        '#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7',
        '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061',
      ],
      r2lab: [
        "#F3537D", "#5EAE10", "#481A88", "#2B15CC", "#8E34FA",
        "#A41987", "#1B5DF8", "#7AAD82", "#8D72E4", "#323C89",
        "#E4466b", "#DE9429", "#198C0F", "#AA322C", "#88713D",
      ],
    }

    // in case category is wrong, use rainbow
    this.colors = this.categories[this.category] || this.categories.rainbow
    // so a shallow copy
    this.colors = this.colors.slice()
    this._debug = false
  }

  debug(...args) {
    if (this._debug)
      console.log(...args)
  }

  random_color(slicename, mine = true) {
    if (slicename in this.hard_wired) {
      return this.hard_wired[slicename]
    } else if (!mine) {
      return this.foreign_color
    }
    let colors = this.colors
    if (colors.length > 0) {
      let index = Math.floor(Math.random() * colors.length)
      let color = colors[index]
      this.debug(`random color: ${slicename} -> ${color}`)
      // remove color
      colors.splice(index, 1)
      return color
    } else {
      // xxx need to be smarter ?
      console.warn("persistent_slices ran out of colors..")
      return this.overflow_color
    }
  }

}

/* ----------
 what gets stored in the browser storage is a JSON encoding
 of a list of pslice objects of that kind
  { 'name' : 'inria_r2lab.tutorial',
    'color' : '#b2182b'
    'current' : true,
    'mine' : true,
  }
---------- */

export class PersistentSlices {

  // at the beginning we only have a list of slice names
  constructor(r2lab_accounts, category) {

    this.slicenames = r2lab_accounts.map(account => account.name)
    // local storage uses this key internally
    this.storage_key = 'r2lab_persistent_slices'
    this.pslices = []
    this.colors_generator = new ColorsGenerator(category)

    //// could be separated some place in some _init method..
    // read local storage
    this._retrieve()
    // update pslices: add new slices, delete old ones
    this._sync()
    // store again
    this._store()
    this._debug = false
  }

  debug(...args) {
    if (this._debug)
      console.log("PersistentSlices", ...args)
  }

  warn_missing_storage() {
    if (typeof (Storage) === undefined) {
      console.warn("WARNING: PersistentSlices can't work properly - no persistent storage")
      return true
    }
  }

  // extract this.pslices from localStorage
  // fill this.pslices from this.slicenames if not possible
  _retrieve() {
    let generator = this.colors_generator
    try {
      /* with storage */
      this.pslices = JSON.parse(localStorage.getItem(this.storage_key))
      if (!this.pslices) {
        throw new Error()
      }
      this.debug("retrieved from local storage", this.pslices)
    } catch (err) {
      if (!this.warn_missing_storage()) {
        this.debug("Could not retrieve persistent slices..")
        this.debug(err.stack)
      }
      /* come up with something decent */
      this.pslices = this.slicenames.map(
        (slicename, i) => ({
          name: slicename,
          color: generator.random_color(slicename),
          mine: true,
          current: (i == 0),
        }))
    }
    this.debug("after retrieve", this.pslices)

  }

  // make sure that:
  // (*) entries not in slicenames get discarded from pslices
  //     this is for slices that we are no longer a member of
  // (*) all entries in slicenames are in pslices
  //     this is for slices that we are a new member of
  // (*) we have exactly one current pslice
  // (*) pslices are sorted
  _sync() {
    // filter out old slices
    this.pslices = this.pslices.filter(
      ps => this.slicenames.indexOf(ps.name) >= 0
    )
    // add new slices
    let generator = this.colors_generator
    // compute the entries not yet in this.pslices
    let known = new Map(this.pslices.map(
      pslice => ([pslice.name, pslice])))
    for (let slicename of this.slicenames) {
      let pslice = known.get(slicename)
      if (!pslice) {
        pslice = {
          name: slicename,
          color: generator.random_color(slicename),
          mine: true,
          current: false,
        }
        this.pslices.push(pslice)
      }
      pslice.mine = true
    }
    // keep sorted
    this.pslices.sort((ps1, ps2) => (ps1.name <= ps2.name) ? -1 : 1)
    // have we one current ?
    let nb_currents = this.pslices.filter(ps => ps.current).length
    if (nb_currents != 1) {
      this.pslices.forEach(function (ps, i) {
        ps.current = (i == 0)
      })
    }
  }

  // store this.pslices as-in in localStorage
  _store() {
    if (this.warn_missing_storage()) {
      return
    }
    let json = JSON.stringify(this.pslices)
    localStorage.setItem(this.storage_key, json)
    this.debug(`wrote in localStorage ${json}`)
  }

  // useful when someone joins a slice that was formerly
  // a foreign slice, its color remains gray-like
  // but clearing this instance allows to re-attach colors to slices
  _clear() {
    localStorage.setItem(this.storage_key, "")
  }

  ////////// make sure the slice is known and create otherwise
  record_slice(slicename, mine = false, current = false) {
    let existing = this._get_pslice(slicename)
    if (existing)
      return existing
    let pslice = {
      name: slicename,
      mine: mine,
      current: current,
      color: this.colors_generator.random_color(slicename, mine),
    }
    this.pslices.push(pslice)
    this._store()
    this.debug(`recorded ${slicename}`, pslice)
    return pslice
  }

  ////////// return a pslice
  _get_pslice(slicename) {
    return this.pslices
      .filter(pslice => pslice.name == slicename).first()
  }
  _get_current_pslice() {
    return this.pslices
      .filter(pslice => pslice.current).first()
  }

  //////////
  all_slice_names() {
    return this.pslices.map(pslice => pslice.name)
  }
  my_slices_names() {
    return this.pslices
      .filter(pslice => pslice.mine)
      .map(pslice => pslice.name)
  }

  ////////// easier access
  get_current_slice_name() {
    let pslice = this._get_current_pslice()
    return pslice ? pslice.name : 'user-not-in-any-slice'
  }
  get_current_slice_color() {
    let pslice = this._get_current_pslice()
    return pslice ? pslice.color : this.foreign_color
  }
  get_slice_color(slicename) {
    let pslice = this._get_pslice(slicename)
    return pslice ? pslice.color : this.foreign_color
  }

  set_current(slicename) {
    let pslice = this._get_pslice(slicename)
    if (!pslice) {
      return
    }
    this.pslices.forEach(pslice => pslice.current = false)
    pslice.current = true
    this._store()
  }

}
