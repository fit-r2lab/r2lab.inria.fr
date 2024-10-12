import numpy as np
import pandas as pd

from django.db import models

from plc.plcapiview import PlcApiView


START = '2019-09-01'

ALLOWED_PERIODS = {
    'day': 'D',
    'week': 'W',
    'month': 'M',
    'year': 'Y',
    'quarter': 'Q',
}

# to create an empty dataframe result
COLUMNS = ['name', 'dt_from', 'dt_until', 'slice_id']

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

# class Stats(models.Model, PlcApiView):
class Stats(PlcApiView):

    # xxx need to cache the Leases and Slices data for like 10 minutes or so
    # def get_leases(self)

    def usage(self):
        return self._usage(periodname=None)
    def usage_per_period(self, period):
        return self._usage(periodname=period)

    def _usage(self, periodname, from_str=START, until_str='now'):

        if periodname is not None and periodname not in ALLOWED_PERIODS:
            print(f"period {periodname} not in {ALLOWED_PERIODS}")
            return pd.DataFrame(columns=COLUMNS)

        # xxx actual filtering
        from_np = np.datetime64(from_str)
        until_np = np.datetime64(until_str)

        # (1) find leases from the API
        self.init_plcapi_proxy()
        all_slices = pd.DataFrame(
            self.plcapi_proxy.GetSlices(
                {'EXPIRED': True, 'DELETED': True},
                ['slice_id', 'name', 'family'],
            ))

        leases1 = pd.DataFrame(
            self.plcapi_proxy.GetLeases(
                {},
                ['t_from', 't_until', 'slice_id'],
            ))

        # (1 bis) translate into datetimes and bind to family
        leases1['dt_from'] = pd.to_datetime(leases1['t_from'], unit='s')
        leases1['dt_until'] = pd.to_datetime(leases1['t_until'], unit='s')
        leases1.drop(columns=['t_from', 't_until'], inplace=True)

        merge1 = leases1.merge(
            all_slices,
            on='slice_id',
            how='left',
        )

        # (2) from the LEASES csv
        leases2 = pd.read_csv('stats/rebuild/REBUILT-LEASES.csv')

        # (2 bis) translate into datetimes and bind to family
        leases2['dt_from'] = pd.to_datetime(leases2['beg'], format="ISO8601")
        leases2['dt_until'] = pd.to_datetime(leases2['end'], format="ISO8601")
        leases2.drop(columns=['beg', 'end'], inplace=True)

        merge2 = leases2.merge(
            all_slices,
            on='name',
            how='left',
        )

        # put it together
        merge = pd.concat([merge1, merge2], ignore_index=True)

        # if missing slice families remain
        # tmp ? load SLICES-FAMILY.csv and merge it with usage
        tmp_slice_family = pd.read_csv('stats/rebuild/HAND-SLICE-FAMILY.csv')
        # keep only the non-empty ones
        tmp_slice_family = tmp_slice_family[tmp_slice_family.family != '']
        # print(f"we are using {len(tmp_slice_family)} hard-wired slice families")

        # isolate the missing ones, solve them, and reasemble
        missing_mask = (merge.family == '') | (merge.family.isna())
        solved = merge[~missing_mask]

        missing = (
            merge[missing_mask]
            .drop(columns=['family'])
            .merge(
                tmp_slice_family,
                on='name',
                how='left',
            )
        )

        merge = pd.concat([solved, missing])


        # fill in with unknown
        merge['family'] = merge['family'].fillna('unknown')
        merge.loc[merge.family == "", 'family'] = 'unknown'

        merge['duration'] = merge['dt_until'] - merge['dt_from']
        merge['duration'] = merge['duration'].apply(round_timedelta_to_hours)


        # if no periodname specified: return raw data
        if periodname is None:
            merge['week'] = merge.dt_from.dt.to_period('W')
            merge['month'] = merge.dt_from.dt.to_period('M')
            merge['year'] = merge.dt_from.dt.to_period('Y')
            merge['quarter'] = merge.dt_from.dt.to_period('Q')
            return merge

        period = ALLOWED_PERIODS[periodname]
        merge['period'] = merge.dt_from.dt.to_period(period)
        usage = (
            merge
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

        # this is where we order the various families
        ordered_type = pd.CategoricalDtype(
            categories = [ 'admin', 'academia/diana', 'academia/slices', 'academia/others', 'industry', 'unknown'],
            ordered=True,
        )
        usage['family'] = usage['family'].astype(ordered_type)
        usage['stack-order'] = usage.family.cat.codes

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
