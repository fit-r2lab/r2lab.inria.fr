title: R2lab Experimenter Page
tab: run
skip_header: yes
require_login: true

<!-- in a first implementation, we were creating the webchat iframe upon page load
     it was suboptimal though, as e.g. freenode being down would cause our page to hang
     so now the chat plugin comes in 2 parts, one for the actual chat area,
     and one for the button to enable it -->
<script type="module"> import "/assets/r2lab/chat.js" </script>
<div id="chat-container"></div>

<div class="container-fluid">
 <div class="row">
  <div class="col-md-12">
   <div id='messages' style="display: none" class="" role="alert">
    <a class="close" onclick="$('.alert').hide()">×</a>
   </div>
   <div id='loading' style="display: none" class="alert alert-info" role="alert">
    <strong>Be patient!</strong> Loading information from server...
   </div>
  </div>
 </div>
 <br />
 <div class="row run" id="all">

 <!-- the left pane with the slices & keys button, and the slices list, on 2 columns -->
 << include r2lab/slices-left-pane.html >>

 <div class="col-md-2 leases-run-width">
   <div id="liveleases_container" class="run"></div>
   <script src="assets/js/jquery-ui-custom-1.12.1.min.js"></script>
   <style> @import url("assets/css/jquery-ui-custom-1.12.1.min.css"); </style>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
   <script src="/assets/js/moment-round.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.min.js"></script>
   <style> @import url("https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.min.css"); </style>

   <!-- the js modules try to autoload their css; however due to a limitation
     -- of full calendar, we need to load this explicitly **beforehand**
     -- https://stackoverflow.com/questions/25178565/fullcalendar-layout-broken-because-css-loading-after-javascript-layout-calculati
     -->
   <style> @import url("/assets/r2lab/liveleases.css"); </style>

   <script type="module"> import "/assets/r2lab/liveleases.js" </script>
   <div id="current-slice" data-current-slice-color="#000"></div>
  </div>

  <style>
    .vertical {
      display: flex;
      flex-direction: column;
    }
    .horizontal {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    }
  </style>

  <div class="col-md-8">
    <div class="vertical">
      <div class="horizontal">
        <span>
          Click a node for more details;
          see also <a href="status.md#livemap:legend">this page for a legend</a>
        </span>
        <span id="chat-button"></span>
      </div>
      <div id="livemap_container">
    </div>
   </div>
   <script type="module">
    import {livemap_options} from "/assets/r2lab/livemap.js";
    // override livemap default settings
    Object.assign(livemap_options, {
      space_x : 72,
      space_y : 87,
      radius_ok : 16,
      radius_pinging : 10,
      radius_warming : 4,
      radius_ko : 0,
      margin_x : 5,
      margin_y : 20,
      padding_x : 45,
      padding_y : 45,
//    debug : true,
   });
  </script>
  <div id="actions"></div>
 </div>
</div>

  <hr/>
  See also <a href="status.md#livetable:legend">this page for a legend</a>; try clicking <span data-toggle="tooltip" title="YES">anywhere in the header or footer</span> to focus on nodes of interest.

  <div class="row" markdown="0">
    <div class="col-md-12">
      <br/>
      <table class="table table-condensed" id='livetable_container'></table>
    </div>
  </div>
</div>

<script type="module">
import {livetable_options} from "/assets/r2lab/livetable.js";
// override default settings
Object.assign(livetable_options, {
//      debug : true,
});
</script>

<!-- defines slices_keys_modal -->
<< include r2lab/slices-keys-modal.html >>
