#!/usr/bin/env python3

"""
compute the stats that get displayed by /stats.md
API endpoints are defined in views.py

data is fetched from the r2lab-api /stats/usage endpoint
"""

import logging

import pandas as pd
import requests

from r2lab.settings import r2labapi_url

R2LAB_API_URL = r2labapi_url

logger = logging.getLogger(__name__)


# the order to display families
FAMILIES = [
    'admin',
    'academia/diana',
    'academia/slices',
    'academia/others',
    'industry',
    'unknown'
]

ALLOWED_PERIODS = {
    'day': 'D',
    'week': 'W',
    'month': 'M',
    'year': 'Y',
    'quarter': 'Q',
}


def _fetch_usage(ts_from, ts_until, period=None):
    """
    Call GET /stats/usage on the r2lab-api.
    Returns a list of dicts (UsageByPeriod or UsageBySlice).
    """
    params = {
        "from": pd.Timestamp(ts_from).isoformat(),
        "until": pd.Timestamp(ts_until).isoformat(),
    }
    if period:
        params["period"] = period
    url = f"{R2LAB_API_URL}/stats/usage"
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _add_family_ordering(df):
    """Add categorical family ordering and family-order column."""
    ordered_type = pd.CategoricalDtype(
        categories=FAMILIES,
        ordered=True,
    )
    df['family'] = df['family'].astype(ordered_type)
    df['family-order'] = df.family.cat.codes
    return df


class Stats:

    def all_leases(self):
        return self._raw_usage('2010', pd.Timestamp.now())

    def per_period_barchart(self, periodname, ts_from, ts_until):
        return self._per_period_barchart(periodname, ts_from, ts_until)

    def per_slice_csv(self, ts_from, ts_until):
        return self._per_slice_csv(ts_from, ts_until)

    def per_slice_heatmap(self, ts_from, ts_until):
        return self._per_slice_heatmap(ts_from, ts_until)

    def _raw_usage(self, ts_from, ts_until):
        """Fetch per-slice usage (no period grouping)."""
        try:
            data = _fetch_usage(ts_from, ts_until)
        except Exception as exc:
            logger.error("Failed to fetch data from r2lab-api: %s", exc)
            return pd.DataFrame({
                'name': pd.Series(dtype='str'),
                'family': pd.Series(dtype='str'),
                'duration': pd.Series(dtype='int64'),
                'family-order': pd.Series(dtype='int64'),
            })

        if not data:
            return pd.DataFrame({
                'name': pd.Series(dtype='str'),
                'family': pd.Series(dtype='str'),
                'duration': pd.Series(dtype='int64'),
                'family-order': pd.Series(dtype='int64'),
            })

        df = pd.DataFrame(data)
        df = df.rename(columns={'slice_name': 'name', 'hours': 'duration'})
        return _add_family_ordering(df)

    def _per_slice_csv(self, ts_from, ts_until):
        df = self._raw_usage(ts_from, ts_until)
        return df[df.duration > 0]

    def _per_period_barchart(self, periodname, ts_from, ts_until):
        """
        Fetch usage grouped by period from the API.
        """
        try:
            data = _fetch_usage(ts_from, ts_until, period=periodname)
        except Exception as exc:
            logger.error("Failed to fetch data from r2lab-api: %s", exc)
            return pd.DataFrame({
                'name': pd.Series(dtype='str'),
                'family': pd.Series(dtype='str'),
                'duration': pd.Series(dtype='int64'),
                'family-order': pd.Series(dtype='int64'),
                'period': pd.Series(dtype='str'),
                'period-middle': pd.Series(dtype='datetime64[ns]'),
            })

        if not data:
            return pd.DataFrame({
                'name': pd.Series(dtype='str'),
                'family': pd.Series(dtype='str'),
                'duration': pd.Series(dtype='int64'),
                'family-order': pd.Series(dtype='int64'),
                'period': pd.Series(dtype='str'),
                'period-middle': pd.Series(dtype='datetime64[ns]'),
            })

        df = pd.DataFrame(data)
        df = df.rename(columns={'slice_name': 'name', 'hours': 'duration'})

        # convert the API's period (ISO datetime of period start) to pandas Period
        pandas_freq = ALLOWED_PERIODS[periodname]
        df['period'] = pd.to_datetime(df['period'], utc=True).dt.to_period(pandas_freq)

        # compute period-middle for altair (midpoint of each period)
        df['period-middle'] = pd.to_datetime(
            df['period'].dt.start_time
            + (df['period'].dt.end_time - df['period'].dt.start_time) / 2
        )

        # retain the nice period rendering of pandas as a string
        df['period'] = df['period'].astype(str)

        df = _add_family_ordering(df)

        # extract the names of the remaining unknown/untagged slices
        untagged_leases = df[(df.family == 'unknown') | (df.family.isna())]
        untagged_slices = untagged_leases.name.unique()
        with open("stats/TMP-UNTAGGED-SLICES.txt", 'w') as f:
            for slicename in sorted(untagged_slices):
                print(slicename, file=f)

        return df

    def _per_slice_heatmap(self, ts_from, ts_until):
        df = self._raw_usage(ts_from, ts_until)

        # remove null rows
        df = df[df.duration != 0]

        # sort by duration
        df.sort_values(by='duration', ascending=False, inplace=True)

        # compute the 'row' column which will map to the Y axis
        df['row'] = df.groupby('family', observed=False).cumcount()

        return df
