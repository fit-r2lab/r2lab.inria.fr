title: R2lab usage statistics
skip_header: yes
skip_footer: yes
<!-- require_login: true -->
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
      <label for="by-criteria">by:</label><br>
      <select name="by-criteria" id="by-criteria">
        <option value="year">Year</option>
        <option value="quarter" selected="selected">Quarter</option>
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
        <option value="slice">Slice</option>
      </select>
  </span>
  <div id="submits">
    <input type="submit" value="Submit">
    <span id="csv">csv</span>
  </div>
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
            #submits {
                display: flex;
                flex-flow: column nowrap;
                align-items: stretch;
                margin-left: 1em;

                input[type="submit"] {
                    padding-top: 5px;
                    padding-bottom: 0px;
                    border-width: 0px;
                    border-radius: 8px;
                    background-color: #A0D683;
                }
                #csv {
                    width: 100%;
                    text-align: center;
                    margin-top: 4px;
                    background-color: #E6C767;
                    border-width: 0px;
                    border-radius: 8px;
                    cursor: alias;
                }
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
        const byCriteria = document.getElementById("by-criteria").value;
        const fromMonth = document.getElementById("from").value;
        const untilMonth = document.getElementById("until").value;
        if (byCriteria === "slice") {
            displayHeatmap(vegaEmbed, fromMonth, untilMonth)
        } else {
            displayBarchart(vegaEmbed, byCriteria, fromMonth, untilMonth);
        }
    }

    const displayBarchart = (vegaEmbed, byPeriod, fromMonth, untilMonth) => {
        let spec_url = `/assets/altair/altair-config-${byPeriod}.json`
        displayStats(vegaEmbed, spec_url, fromMonth, untilMonth)
    }
    const displayHeatmap = (vegaEmbed, fromMonth, untilMonth) => {
        let spec_url = `/assets/altair/altair-config-slice.json`
        displayStats(vegaEmbed, spec_url, fromMonth, untilMonth)
    }

    const displayStats = (vegaEmbed, spec_url, fromMonth, untilMonth) => {

        document.body.style.cursor = "wait"

        fetch(spec_url)
            .then(response => response.json())
            .then(spec => {
                spec.data.url += `/${fromMonth}`
                if (untilMonth) { spec.data.url += `/${untilMonth}` }

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
                    .catch((error) => showError(el, error))
                    .finally(() => document.body.style.cursor = null)
            })

    }

    const download = (download_as, text) => {
        const element = document.createElement('a')
        element.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
        element.setAttribute('download', download_as)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const dowloadCsv = () => {
        const fromMonth = document.getElementById("from").value
        const untilMonth = document.getElementById("until").value || "now"
        const url = `/api/stats/slice/csv/${fromMonth}/${untilMonth}`
        fetch (url)
            .then(response => response.text())
            .then(
                text => download(
                    `r2lab-stats-${fromMonth}-${untilMonth}.csv`, text))
    }

    const startup = () => {
        const by_from_url = '{{by}}'
        const from_period = '{{from_period}}'
        const until_period = '{{until_period}}'
        if (by_from_url) {
            document.getElementById("by-criteria").value = by_from_url
        }
        if (from_period) {
            document.getElementById("from").value = from_period
        }
        if (until_period) {
            document.getElementById("until").value = until_period
        }
        console.log("by", by_from_url, "from", from_period, "until", until_period)
    }

    window.addEventListener("DOMContentLoaded", () => {
        startup()
        displayStatsFromDialog()
        document.getElementById("by-criteria")
            .addEventListener("change", displayStatsFromDialog)
        document.getElementById("csv")
            .addEventListener("click", dowloadCsv)
    })
    // document.querySelector('input[type="submit"]').style.display="none"
</script>
