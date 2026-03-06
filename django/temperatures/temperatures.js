// show the placeholder message
const loadingDiv = document.getElementById("loading");
loadingDiv.style.display = "block";

// Vega-Lite spec
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
  vegaEmbed("#temperatures-combined", specCombined, { actions: false });
  vegaEmbed("#temperatures-stacked", specStacked, { actions: false });
}

const URL = "/data.json";

// Load all CSVs and merge client-side
fetch(URL)
  .then((r) => r.json())
  .then((merged) => {
    console.log("Data loaded:", merged.length, "records");
    specCombined.data = { values: merged };
    specStacked.data = { values: merged };
    renderChart();
    loadingDiv.style.display = "none";
  })
  .catch((err) => {
    loadingDiv.textContent = "❌ Error loading data: " + err;
  });

window.addEventListener("resize", () => {
  // debounce to avoid over-rendering
  clearTimeout(window._vega_resize_timer);
  window._vega_resize_timer = setTimeout(renderChart, 250);
});
