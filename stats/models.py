import numpy as np
import pandas as pd

from django.db import models

from plc.plcapiview import PlcApiView


START = '2019-09-01'

ALLOWED_PERIODS = {
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

        from_epoch = numpy_to_epoch(from_np)
        until_epoch = numpy_to_epoch(until_np)

        self.init_plcapi_proxy()
        all_slices = pd.DataFrame(
            self.plcapi_proxy.GetSlices(
                {'EXPIRED': True, 'DELETED': True},
                ['slice_id', 'name', 'family'],
            ))


        leases = pd.DataFrame(
            self.plcapi_proxy.GetLeases(
                {']t_from': from_epoch, '[t_until': until_epoch},
                ['t_from', 't_until', 'slice_id'],
            ))

        if len(leases) == 0:
            return pd.DataFrame(columns=COLUMNS)

        leases['dt_from'] = pd.to_datetime(leases['t_from'], unit='s')
        leases['dt_until'] = pd.to_datetime(leases['t_until'], unit='s')
        leases.drop(columns=['t_from', 't_until'], inplace=True)
        leases['duration'] = leases['dt_until'] - leases['dt_from']
        leases['duration'] = leases['duration'].apply(round_timedelta_to_hours)

        merge = leases.merge(
            all_slices,
            on='slice_id',
            how='outer',
        )

        # if no periodname specified: return raw data
        if periodname is None:
            merge['week'] = merge.dt_from.dt.to_period('W')
            merge['month'] = merge.dt_from.dt.to_period('M')
            merge['year'] = merge.dt_from.dt.to_period('Y')
            merge['quarter'] = merge.dt_from.dt.to_period('Q')
            return merge

        # else do the grouping
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
        print(usage.dtypes)
        return usage
