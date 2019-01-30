title: R2lab Scheduler
tab: book
skip_header: yes
require_login: true

<div class="container">
<div class="alert alert-primary text-center">
Please make sure to check <a href="#policy">our reservation policy</a> below.
</div>
</div>


<div class="container" markdown="1">
<div class="alert alert-danger" role="alert" markdown="1">
<strong>Important notes!</strong>

* R2lab platform is reset every time a <strong>nightly</strong> slice is found in the calendar,
which occurs a couple times a week on average.
As part of this verification routine, the testbed will be thoroughly reset and <strong>all data will be lost</strong>.
* In any case, please make sure to **save your experiment's data** once you are done,
as the next user will probably reload an image on your nodes.
* All times on this website are expressed wrt the <strong>CET timezone</strong>,
which is UTC+1 in winter, and UTC+2 in summer.
</div>

 <div class="row">
  <div class="col-md-12">
   <div id='messages' style="display: none" class="" role="alert">
    <a class="close" onclick="$('.alert').hide()">×</a>
   </div>
  </div>
 </div>

<br />

<script type="module">
import {liveleases_options} from "/assets/r2lab/liveleases.js";
// override liveleases default settings
Object.assign(liveleases_options, {
   mode : 'book',
});
</script>

<div class="row book" id="all">
 <!-- the left pane with the slices & keys button, and the slices list, on 2 columns -->
 << include r2lab/slices-left-pane.html >>
 <div class="col-md-10">
  <div id="liveleases_container" class="book"></div>
   <script src="assets/js/jquery-ui-custom-1.12.1.min.js"></script>
   <style> @import url("assets/css/jquery-ui-custom-1.12.1.min.css"); </style>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
   <script src="/assets/js/moment-round.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.min.js"></script>
   <style> @import url("https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.4.0/fullcalendar.min.css"); </style>

   <style> @import url("/assets/r2lab/liveleases.css"); </style>
   <div id="current-slice" data-current-slice-color="#000"></div>
  </div>
 </div>

<div class="alert alert-info" role="alert" markdown="1">
<div class="text-center" id="policy"><h2>Reservation policy</h2></div>

<p>The software does not enforce any limitation on the duration or frequency of reservations.<br/>
We expect however everyone to adhere to the following, common sense, rules: </p>

* Please do not reserve for more than 2 consecutive hours during daytime.
* When reserving in advance, please create a maximum of 2 slices for one given day.
* During the last half-hour of your reserved time, if there is no other reservation following the current slot, it is OK to extend for another 2 hours, and so on.
* Finally, if you are done early, then please just delete the current slot; the software will then automatically shrink your lease (so that we keep track, for accurate testbed usage statistics) so that the testbed becomes available to others.

Thanks !
</div>

<!-- defines slices_keys_modal -->
<< include r2lab/slices-keys-modal.html >>

</div>
