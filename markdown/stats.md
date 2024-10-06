title: R2lab usage statistics
skip_header: yes
skip_footer: yes
<!-- skip_title: yes -->
<!-- skip_menu: yes -->

<div id="overall">

<div id="first-row">

<div id="text">

Reliable usage collection is operational since 2021-09-01
<br>
for now one cannot select a time slot - stay tuned..
<br>
also responsiveness is not perfect yet, so please reload the page once your geometry is fine

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

</div>

<div id="stats-container"></div>

</div> <!-- overall -->

<style>
    /* our stuff */
    /* propagate full height to stats-container */
    body, html {
        height: 100%;
    }
    body {
        display: flex;
        flex-direction: column;
        /* again this is to propagate full height to stats-container */
        /* it applies to all flex containers down the tree */
        :nth-child(2) { flex-grow: 1; }

        .container-fluid {
            display: flex;
            flex-direction: column;

            .col-md-12 {
                display: flex;
                flex-direction: column;
            }
        }
    }
    #overall {
        display: flex;
        flex-direction: column;

        #first-row {
            display: flex;
            justify-content: space-between;
        }

        #dialog {
            /* override above setting */
            flex-grow: 0;
            /* turn off some openlab-fit defaults */
            select, option {
                min-width: initial!important;
                max-width: initial!important;
                border-radius: 8px;
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

        /* temporary, to outline the vega container */
        #stats-container {
            border: 5px solid #7E60BF;
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
        let spec = `/assets/altair/altair-config-${byPeriod}.json`;
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
        vegaEmbed("#stats-container", spec, embedOpt)
            .then(result => console.log("embed result", result))
            .catch((error) => showError(el, error));
    }
    window.addEventListener("DOMContentLoaded", () => {
        displayStats(vegaEmbed, "quarter")
    })
    // temporary, while we can't choose dates yet
    document.getElementById("by-period").addEventListener("change", displayStatsFromDialog)
    document.querySelector('input[type="submit"]').style.display="none"
</script>
