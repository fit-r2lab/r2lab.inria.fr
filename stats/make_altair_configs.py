"""
this file allows to generate the configuration files for the altair charts
they are saved locally as json files, and should be xxx
"""

import pandas as pd

import altair as alt
from vega_datasets import data

ASSETS_DIR = "../assets/altair"

# seems to work from within ipython only
alt.renderers.enable("browser")

SERVER = "https://r2lab.inria.fr"
# SERVER = "http://localhost:8000"

supported = {
    'D': dict(
        name="day",
        timeUnit="yearmonthdate",
    ),
    'W': dict(
        name="week",
        timeUnit="yearweek",
    ),
    'M': dict(
        name="month",
        timeUnit="yearmonth",
    ),
    'Q': dict(
        name="quarter",
        timeUnit="yearquarter",
    ),
    'Y': dict(
        name="year",
        timeUnit="year",
    ),
}

def generate_config(shortname, display=True, save_html=False):
    values = supported[shortname]
    name = values['name']
    url = f"{SERVER}/stats/{name}"
    print(f"Fetching {url}")

    chart = (
        alt.Chart(url)
        .mark_bar()
        .encode(
            x=alt.X(
                f'period-middle:T',
                axis=alt.Axis(title=f"Period (by {name})"),
                timeUnit=f"{values['timeUnit']}",
            ),
            # x=alt.X('period:N'),
            y=alt.Y('sum(duration):Q', title='Duration (hours)'),
            color='family:N',
            tooltip=['name:N', 'period:N', 'family:N', 'sum(duration):Q'],
        )
        .interactive()
        .properties(height='container', width='container')
    )

    # that what we want
    chart.save(f"{ASSETS_DIR}/altair-config-{name}.json")
    if display:
        chart.display()
    if save_html:
        # not in the assets dir
        chart.save(f"altair-sample-{name}.html", embed_options={'renderer': 'svg'})

for shortname in supported:
# for current in 'D':
    generate_config(shortname, save_html=True)

# patch the hard-wired SERVER url with relative ones
# we don't do this warlier so we can see the results earlier in the browser

from pathlib import Path

for config in Path("../assets/altair").glob("*.json"):
    with open(config) as f:
        content = f.read()
    content2 = content.replace(SERVER, "")
    if content2 != content:
        print(f"Patching {config}")
        with open(config, 'w') as f:
            f.write(content2)
    else:
        print(f"{filename} did not need patching")
