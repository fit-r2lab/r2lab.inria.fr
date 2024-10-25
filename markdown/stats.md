title: R2lab usage statistics
skip_header: yes
skip_footer: yes
<!-- skip_title: yes -->
<!-- skip_menu: yes -->

<div id="overall">

<div id="first-row">

<div id="text">

responsiveness is not perfect, please reload the page after resizing

</div>

<form id="dialog" action="javascript:displayStatsFromDialog()">
    <span>
        <label for="from">from month:</label><br>
        <input type="month" id="from" name="from" value="2016-01"><br>
    </span>
    <span>
        <label for="until">until month:</label><br>
        <input type="month" id="until" name="until"><br>
    </span>
  <span>
      <label for="by-period">by:</label>
      <select name="by-period" id="by-period">
        <option value="year">Year</option>
        <option value="quarter" selected="selected">Quarter</option>
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
      </select>
  </span>
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
            /* less space for the title that otherwise is huge */
            :nth-child(1)>.fit {
                padding: 10px 0px 0px 0px;
            }
        }
    }
    #overall {
        display: flex;
        flex-direction: column;

        #first-row {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
        }

        #dialog {
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            /* align-items: center; */
            align-items: flex-start;
            margin-bottom: 8px;
            /* override above setting */
            flex-grow: 0;
            /* turn off some openlab-fit defaults */
            select, option {
                min-width: initial!important;
                max-width: initial!important;
                border-radius: 8px;
            }
            span {
                margin-right: 1em;
            }
            label {
                margin-bottom: 0;
                margin-right: 1em;
            }
            input[type="submit"] {
                margin-left: 1em;
                border-radius: 8px;
                padding-top: 5px;
                background-color: #A0D683;
            }
        }

        /* temporary, to outline the vega container */
        #stats-container {
            border: 3px solid #7E60BF;
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
        const fromMonth = document.getElementById("from").value;
        const untilMonth = document.getElementById("until").value;
        console.log("from", fromMonth, "until", untilMonth, "by", byBin);
        // if (fromMonth === "") { alert("Please provide a from date"); return; }
        // if (untilMonth === "") { alert("Please provide a until date"); return; }
        console.log("displayStatsFromDialog", byBin, fromMonth, untilMonth)
        displayStats(vegaEmbed, byBin, fromMonth, untilMonth);
    }

    const displayStats = (vegaEmbed, byPeriod, fromMonth, untilMonth) => {
        let spec_url = `/assets/altair/altair-config-${byPeriod}.json`;

        fetch(spec_url)
            .then(response => response.json())
            .then(spec => {
                spec.data.url += `/${fromMonth}`
                if (untilMonth) { spec.data.url += `/${untilMonth}` }
                console.log(spec)

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
            })
    }
    window.addEventListener("DOMContentLoaded", () => {
        displayStatsFromDialog()
    })
    // temporary, while we can't choose dates yet
    document.getElementById("by-period").addEventListener("change", displayStatsFromDialog)
    // document.querySelector('input[type="submit"]').style.display="none"
</script>
