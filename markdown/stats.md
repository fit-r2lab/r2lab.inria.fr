title: R2lab usage statistics
skip_header: yes
skip_footer: yes
<!-- skip_title: yes -->
<!-- skip_menu: yes -->

Reliable usage collection is operational since 2021-09-01

for now this figure is available per quarter only - stay tuned..

<div id="vis"></div>

  <style>
    #vis.vega-embed {
      width: 100%;
      display: flex;
    }

    #vis.vega-embed details,
    #vis.vega-embed details summary {
      position: relative;
    }
  </style>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>

  <script>
    (function(vegaEmbed) {
      var spec = {"config": {"view": {"continuousWidth": 300, "continuousHeight": 300}}, "data": {"url": "/stats/quarter/"}, "mark": {"type": "bar"}, "encoding": {"color": {"field": "family", "type": "nominal"}, "tooltip": [{"field": "family", "type": "nominal"}, {"field": "name", "type": "nominal"}], "x": {"field": "period", "type": "nominal"}, "y": {"aggregate": "sum", "field": "duration", "title": "Duration (hours)", "type": "quantitative"}}, "height": 800, "params": [{"name": "param_2", "select": {"type": "interval", "encodings": ["x", "y"]}, "bind": "scales"}], "width": "container", "$schema": "https://vega.github.io/schema/vega-lite/v5.20.1.json"};
      var embedOpt = {"mode": "vega-lite"};

      function showError(el, error){
          el.innerHTML = ('<div style="color:red;">'
                          + '<p>JavaScript Error: ' + error.message + '</p>'
                          + "<p>This usually means there's a typo in your chart specification. "
                          + "See the javascript console for the full traceback.</p>"
                          + '</div>');
          throw error;
      }
      const el = document.getElementById('vis');
      vegaEmbed("#vis", spec, embedOpt)
        .catch(error => showError(el, error));
    })(vegaEmbed);

  </script>
