#!/usr/bin/env python3

"""
compute the stats that get displayed by /stats.md
API endpoints are defined in views.py

data is fetched from the r2lab-api REST service
"""

import logging

import numpy as np
import pandas as pd
import requests

from r2lab.secrets import R2LAB_API_URL, R2LAB_API_EMAIL, R2LAB_API_PASSWORD


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

def _empty_leases_dataframe():
    """Return an empty DataFrame with the correct dtypes for downstream code."""
    return pd.DataFrame({
        'name': pd.Series(dtype='str'),
        'dt_from': pd.Series(dtype='datetime64[ns]'),
        'dt_until': pd.Series(dtype='datetime64[ns]'),
        'family': pd.Series(dtype='str'),
        'duration': pd.Series(dtype='int64'),
        'family-order': pd.Series(dtype='int64'),
    })


def numpy_to_epoch(dt):
    # return genuine ints that need to be marshaled
    return int(dt.astype('datetime64[s]').astype('int'))

def epoch_to_numpy(epoch):
    return np.datetime64(epoch, 's')

def round_timedelta_to_hours(timedelta):
    x = timedelta
    if isinstance(x, pd.Timedelta):
        x = timedelta.total_seconds()
    return int(((x-1) // 3600) + 1)


class R2labApiClient:
    """
    Minimal client for the r2lab-api REST service.
    Authenticates once (lazy) and caches the token.
    """

    def __init__(self):
        self._token = None

    def _login(self):
        """POST /auth/login to obtain a bearer token."""
        url = f"{R2LAB_API_URL}/auth/login"
        resp = requests.post(url, json={
            "email": R2LAB_API_EMAIL,
            "password": R2LAB_API_PASSWORD,
        }, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]

    def _auth_headers(self):
        if self._token is None:
            self._login()
        return {"Authorization": f"Bearer {self._token}"}

    def get_leases(self):
        """GET /leases — public, no auth required."""
        url = f"{R2LAB_API_URL}/leases"
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_slices(self):
        """GET /slices — auth required."""
        url = f"{R2LAB_API_URL}/slices"
        resp = requests.get(url, headers=self._auth_headers(), timeout=30)
        resp.raise_for_status()
        return resp.json()

class Stats:

    def all_leases(self):
        return self._raw_usage('2010', pd.Timestamp.now())

    def per_period_barchart(self, periodname, ts_from, ts_until):
        leases = self._raw_usage(ts_from, ts_until)
        return self._per_period_barchart(leases, periodname)

    def per_slice_csv(self, ts_from, ts_until):
        leases = self._raw_usage(ts_from, ts_until)
        return self._per_slice_csv(leases)

    def per_slice_heatmap(self, ts_from, ts_until):
        leases = self._raw_usage(ts_from, ts_until)
        return self._per_slice_heatmap(leases)

    def _raw_usage(self, ts_from, ts_until):

        try:
            client = R2labApiClient()
            raw_leases = client.get_leases()
            raw_slices = client.get_slices()
        except Exception as exc:
            logger.error("Failed to fetch data from r2lab-api: %s", exc)
            return _empty_leases_dataframe()

        # build slice_name → family lookup directly from slices
        slice_family = {
            slc["name"]: slc.get("family", "unknown") or "unknown"
            for slc in raw_slices
        }

        # build DataFrame from leases
        if not raw_leases:
            return _empty_leases_dataframe()

        leases = pd.DataFrame(raw_leases)

        # rename API fields to internal names
        leases = leases.rename(columns={
            'slice_name': 'name',
            't_from': 'dt_from',
            't_until': 'dt_until',
        })

        # convert ISO datetime strings to tz-naive UTC datetimes
        leases['dt_from'] = pd.to_datetime(
            leases['dt_from'], utc=True
        ).dt.tz_localize(None)
        leases['dt_until'] = pd.to_datetime(
            leases['dt_until'], utc=True
        ).dt.tz_localize(None)

        # assign family via slice_name lookup
        leases['family'] = leases['name'].map(slice_family)

        # filter on the requested period
        leases = leases[(leases.dt_from >= ts_from) & (leases.dt_until <= ts_until)]

        # fill in with unknown
        untagged_mask = (leases.family == '') | (leases.family.isna())
        leases.loc[untagged_mask, 'family'] = 'unknown'

        leases['duration'] = leases['dt_until'] - leases['dt_from']
        leases['duration'] = leases['duration'].apply(round_timedelta_to_hours)

        # this is where we order the various families
        ordered_type = pd.CategoricalDtype(
            categories=FAMILIES,
            ordered=True,
        )
        leases['family'] = leases['family'].astype(ordered_type)
        leases['family-order'] = leases.family.cat.codes

        return leases

    def _per_slice_csv(self, leases):
        slices = (
            leases.
                groupby(by=['family', 'name'])
                .agg({'duration': 'sum'})
                .reset_index()
        )
        return slices[slices.duration > 0]

    def _per_period_barchart(self, leases, periodname):
        """
        does a groupby by periodname
        """

        # group by period and family
        period = ALLOWED_PERIODS[periodname]
        leases['period'] = leases.dt_from.dt.to_period(period)
        usage = (
            leases
            .groupby(by=['family', 'period', 'name'])
            .agg({'duration': 'sum'})
            # .reset_index()
        )
        # promote index levels as regular columns
        usage.reset_index(inplace=True)

        # as altair cannot handle period objects, we expose a timestamp
        # which is the middle of the period
        usage['period-middle'] = pd.to_datetime(
            usage['period'].dt.start_time
            + (usage['period'].dt.end_time - usage['period'].dt.start_time) / 2
        )

        # and retain the nice period rendering of pandas as a string
        usage['period'] = usage['period'].astype(str)

        # tmp - extract the names of the remaining unknown/untagged slices
        def untagged_slices_and_leases(usage):
            untagged_leases = usage[(usage.family == 'unknown') | (usage.family.isna())]
            untagged_slices = untagged_leases.name.unique()
            return untagged_slices, untagged_leases

        untagged_slices, untagged_leases = untagged_slices_and_leases(usage)
        with open("stats/TMP-UNTAGGED-SLICES.txt", 'w') as f:
            for slicename in sorted(untagged_slices):
                print(slicename, file=f)

        return usage

    def _per_slice_heatmap(self, leases):

        for col in 'dt_from', 'dt_until', 'lease_id':
            if col in leases.columns:
                leases.drop(columns=[col], inplace=True)

        # first compute the total duration per slice
        df = (
            leases
            .groupby(
                by=['name', 'family', 'family-order'],
                observed=False)
            .agg({'duration': 'sum'})
            .reset_index()
        )

        # remove null rows (how on earth do we end up with these ?)
        df = df[df.duration != 0]

        # sort by duration
        df.sort_values(by='duration', ascending=False, inplace=True)

        # compute the 'row' column which will map the the Y axis
        df['row'] = df.groupby('family', observed=False).cumcount()

        return df
