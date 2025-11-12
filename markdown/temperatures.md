title: R2lab temperatures history
skip_header: yes
skip_footer: yes
<!-- require_login: true -->
<!-- skip_title: yes -->
<!-- skip_menu: yes -->

<script>
  const CHOICES = {
    day1: { duration: '1d'},
    day2: { duration: '2d'},
    week1: { duration: '7d',  resample_period: '1h' },
    week2: { duration: '14d', resample_period: '2h' },
    week3: { duration: '21d', resample_period: '3h' },
    month1: { duration: '30d', resample_period: '6h' },
    month2: { duration: '61d', resample_period: '6h' },
    quarter1: { duration: '91d', resample_period: '12h' },
    quarter2: { duration: '182d', resample_period: '12h' },
    year1: { duration: '365d', resample_period: '1d' },
    forever_1d: { resample_period: '1d' },
    forever_raw: {},
  }
</script>

<div id="overall">
  <div id="first-row">

    <span>

      <label for="display-mode">Display mode:</label><br>
      <select id="display-mode" name="display-mode">
          <option value="combined">combined</option>
          <option value="stacked">stacked</option>
      </select>

    </span>

  <form id="dialog" action="javascript:displayTemperaturesFromDialog()">
    <span>
        <label for="period">show last:</label><br>
        <select id="period" name="period">
            <option value="day1">24h</option>
            <option value="day2">48h</option>
            <option value="week1">1 Week / 1h</option>
            <option value="week2" selected="selected">2 Weeks / 2h</option>
            <option value="week3">3 Weeks / 3h</option>
            <option value="month1">1 Month / 6h</option>
            <option value="month2">2 Months / 6h</option>
            <option value="quarter1">1 Quarter / 6h</option>
            <option value="quarter2">2 Quarters / 6h</option>
            <option value="year1">1 Year / 6h</option>
            <option value="forever_1d">Forever / 1d</option>
            <option value="forever_raw">Forever / raw</option>
        </select>
    </span>

    <input type="submit" value="Submit">

  </form>

  <div id="loading">Loading data… ⏳</div>

  </div> <!-- first-row -->

  <div id="temperatures-container"></div>

</div> <!-- overall -->

<style>

    #first-row {
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      margin-bottom: 20px;

      #display-mode {
        margin-right: 50px;
      }

      input[type="submit"] {
        padding-top: 5px;
        padding-bottom: 0px;
        border-width: 0px;
        border-radius: 8px;
        background-color: #A0D683;
        margin: 0px 30px;
    }

      #loading {
        display: none;
        font-size: 40px;
        font-family: "Courier New", Courier, monospace;
      }
    }
    #temperatures-container {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      width: 100%; /* or 800px, or 100% */
      > svg {
        width: 90vw !important;
      }
    }

</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/vega/6.2.0/vega.min.js" integrity="sha512-a0MvScZu4OlG2uIQtDYugg4GWVyk2YDEKoWt9kAHlW3hiNuwYoZmVz6D7ksouUKBIUiLYfdMc8f/taYk9hbCbA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vega-lite/6.4.1/vega-lite.min.js" integrity="sha512-YR+HhmTzn3uI6txUYLROIPAr1yuQVjJ2djyDfq+ZWMwe4LgEXyiPPYn9LlQE9P2DwZSlwkO2NBOigBQBr7mk7g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vega-embed/7.0.2/vega-embed.min.js" integrity="sha512-sN01iN/FB7CxcwWiE+BZUadk7T04QGhOJit1KBWJChZkdjvyxsS5tntVrMikgSYBIgvH+WH2ssKswk2e+aSQnQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

<script>
// const URL = "http://localhost:8081/data.json";
const URL = "/api/relays/temperatures";

// Vega-Lite specs
const specStacked = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  facet: {
    row: {
      field: "relay",
      type: "nominal",
      title: "Device",
      // "header": {labelAngle: 0, labelFontSize: 12},
    },
  },

  resolve: {
    scale: { x: "shared" },
  },

  spec: {
    width: "container",
    height: 100,
    mark: { type: "line", point: { size: 15 } },

    params: [
      {
        name: "zoom",
        select: { type: "interval", encodings: ["x"], bind: "scales" },
      }
    ],

    encoding: {
      x: {
        field: "timestamp",
        type: "temporal",
        title: "Time",
        domain: { param: "zoom" },
      },
      y: {
        field: "temperature",
        type: "quantitative",
        title: "Temperature (°C)",
        scale: { zero: false },
      },
      color: { field: "relay", type: "nominal", legend: null },
      tooltip: [
        { field: "temperature", type: "quantitative", title: "Temperature (°C)" },
        { field: "timestamp", type: "temporal", title: "Time", format: "%m-%d %H:%M:%S" },
      ],
    },
  },

};

const specCombined = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",

  width: "container",
  height: 600,

  // data: { values: yourDataArray },

  // Optional zoom
  params: [
    {
      name: "zoom",
      select: { type: "interval", encodings: ["x"] },
      bind: "scales",
    },
    {
      name: "legend_filter",
      select: { type: "point", fields: ["relay"]},
      bind: "legend",
    },
  ],

    mark: { type: "line", point: { size: 15 } },

  encoding: {
    x: {
      field: "timestamp",
      type: "temporal",
      title: "Time",
    },
    y: {
      field: "temperature",
      type: "quantitative",
      title: "Temperature (°C)",
      scale: { zero: false }
    },
    color: {
      field: "relay",
      type: "nominal",
      title: "Relay",
    },
    tooltip: [
      { field: "relay", type: "nominal", title: "Relay" },
      { field: "temperature", type: "quantitative", title: "Temperature (°C)" },
      { field: "timestamp", type: "temporal", title: "Time", format: "%m-%d %H:%M:%S" },
    ],
    opacity: {
      condition: {
        param: "legend_filter",
        value: 1
      },
      value: 0.1,
    },
  },

};

function renderChart() {
  const spec = (document.getElementById("display-mode").value === "stacked") ? specStacked : specCombined;
  vegaEmbed("#temperatures-container", spec, { actions: false });
}

function displayTemperaturesFromDialog() {

  // show the placholder message
  const loadingDiv = document.getElementById("loading");
  loadingDiv.style.display = "block";

  const period = document.getElementById("period").value;
  const params = CHOICES[period];

  // Load URL data
  fetch(URL, {
    headers: {
      'Accept': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(params),
  })
  .then((r) => r.json())
  .then((merged) => {

      console.log("Data loaded:", merged.length, "records");

      specStacked.data = { values: merged };
      specCombined.data = { values: merged };
      renderChart();
      loadingDiv.style.display = "none";

  })
  .catch((err) => {

    loadingDiv.textContent = "❌ Error loading data: " + err;

  });
}

window.addEventListener("resize", () => {
  // debounce to avoid over-rendering
  clearTimeout(window._vega_resize_timer);
  window._vega_resize_timer = setTimeout(renderChart, 250);
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("period").addEventListener("change", displayTemperaturesFromDialog );
  document.getElementById("display-mode").addEventListener("change", renderChart );
  displayTemperaturesFromDialog();
});

</script>
