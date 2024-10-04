title: R2lab usage statistics
skip_header: yes
skip_footer: yes
<!-- skip_title: yes -->
<!-- skip_menu: yes -->

<div id="overall">

<div id="text">

Reliable usage collection is operational since 2021-09-01
<br>
for now one cannot select a time slot - stay tuned..

</div>

<form id="dialog" action="javascript:displayStatsFromDialog()">
  <label for="by-period">one bar by:</label>
  <select name="by-period" id="by-period">
    <option value="year">Year</option>
    <option value="quarter" selected="selected">Quarter</option>
    <option value="month">Month</option>
    <option value="week">Week</option>
    <option value="day">Day</option>
  </select>
  <input type="submit" value="Submit">
</form>


<div id="stats-container"></div>

</div> <!-- overall -->

<style>
    /* our stuff */
    #overall {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
            "text dialog"
            "stats stats"
        ;

        #text { grid-area: text; }
        #dialog { grid-area: dialog; }
        #stats-container { grid-area: stats; }

        #dialog {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            /* text-align: right; */
            /* turn off some openlab-fit defaults */
            select, option {
                min-width: initial!important;
                max-width: initial!important;
            }
            label {
                margin-bottom: 0;
                margin-right: 1em;
            }
            input[type="submit"] {
                margin-left: 1em;
                border-radius: 8px;
                background-color: #A0D683;
            }
        }
    }

    /* originally from altair-produced html */
    #stats-container.vega-embed {
        width: 100%;
        display: flex;
    }

    #stats-container.vega-embed details,
    #stats-container.vega-embed details summary {
        position: relative;
    }
</style>

<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega@5" ></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1" ></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vega-embed@6" ></script>

<script>
    const displayStatsFromDialog = () => {
        const byBin = document.getElementById("by-period").value;
        displayStats(vegaEmbed, byBin);
    }

    const displayStats = (vegaEmbed, byPeriod) => {
        let spec = {
        config: { view: { continuousWidth: 300, continuousHeight: 300 } },
        data: { url: `/stats/${byPeriod}/` },
        mark: { type: "bar" },
        encoding: {
            color: { field: "family", type: "nominal" },
            tooltip: [
                { field: "family", type: "nominal" },
                { field: "name", type: "nominal" },
            ],
            x: { field: "period", type: "nominal" },
            y: {
                aggregate: "sum",
                field: "duration",
                title: "Duration (hours)",
                type: "quantitative",
            },
        },
        height: 600,
        params: [
            {
                name: "param_2",
                select: { type: "interval", encodings: ["x", "y"] },
                bind: "scales",
            },
        ],
        width: "container",
        $schema: "https://vega.github.io/schema/vega-lite/v5.20.1.json",
        };
        const embedOpt = { mode: "vega-lite" };

        const showError = (el, error) => {
        el.innerHTML =
            '<div style="color:red;">' +
            "<p>JavaScript Error: " +
            error.message +
            "</p>" +
            "<p>This usually means there's a typo in your chart specification. " +
            "See the javascript console for the full traceback.</p>" +
            "</div>";
        throw error;
        }
        const el = document.getElementById("stats-container");
        vegaEmbed("#stats-container", spec, embedOpt).catch((error) => showError(el, error));
    }
    window.addEventListener("DOMContentLoaded", () => {
        displayStats(vegaEmbed, "quarter")
    })
    // temporary, while we can't choose dates yet
    document.getElementById("by-period").addEventListener("change", displayStatsFromDialog)
    document.querySelector('input[type="submit"]').style.display="none"
</script>
