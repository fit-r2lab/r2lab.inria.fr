/*
 * tools for managing current slice
 */

var current_slice = {
    debug : true,

    // the value of interest
    name : "",

    // the key for storing the value
    key : 'r2lab:current_slice',
    // the class for decorating html elements
    klass : 'current_slice',

    // retrieve current slice upon page load
    // avail_slices is the full list as retrieved at the registry
    // mostly for the r2lab_user.js template
    init_from_storage : function(avail_slices) {
	current_slice.name = current_slice.get(avail_slices);
	current_slice.store(current_slice.name);
    },

    get : function(avail_slices) {
	if (avail_slices.length == 0) {
	    console.log("WARNING: current_slice.get_last: no slices to chose from");
	    return "";
	}
	var default_slice = avail_slices[0];
	// non-html5 browsers
	if (typeof(Storage) === "undefined") {
	    console.log("WARNING: current_slice.get_last: no local storage");
	    return default_slice;
	} 
	stored = localStorage.getItem(current_slice.key);
	// check it's still current
	if (avail_slices.indexOf(stored) >= 0) {
	    if (current_slice.debug) console.log("Retrieved current_slice:"+stored);
	    return stored;
	}
	if (current_slice.debug) console.log("Returning default:"+default_slice);
	return default_slice;
    },

    store : function(slice) {
	if (typeof(Storage) === "undefined") {
	    console.log("WARNING: current_slice.store : no local storage");
	} else {
	    if (current_slice.debug) console.log("Storing current_slice:"+slice);
	    localStorage.setItem(current_slice.key, slice);
	}
    },

    // highlight the item corresponding to current slice
    update_selectors : function() {
	$('.set_current_slice').each(function(index){
            if ($(this).attr('slicename') == current_slice.name){
		$(this).addClass(current_slice.klass);
	    } else {
	    $(this).removeClass(current_slice.klass);
	    }
	});
    },
				     
    // all elements of type 'set_current_slice' need a click function
    // defined on them that will change the current slice name
    arm_selectors : function() {
	$('.set_current_slice').on("click", function(){
	    var new_slice = $(this).attr("slicename");
	    current_slice.store(new_slice);
	    current_slice.name = new_slice;
	    current_slice.update_selectors();
	});
    },

    // stuff to call on page load
    init : function(){
	current_slice.update_selectors();
	current_slice.arm_selectors();
    }
};
$(current_slice.init)