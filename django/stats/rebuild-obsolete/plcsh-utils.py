import numpy as np
import pandas as pd


def numpy_to_epoch(dt):
    # return genuine ints that need to be marshaled
    return int(dt.astype('datetime64[s]').astype('int'))

BEG = numpy_to_epoch(np.datetime64('2019-09-01'))

def convert_beg_end(beg, end):
    #
    if isinstance(beg, str):
        beg = numpy_to_epoch(np.datetime64(beg))
    filter = {']t_from': beg}
    if end is not None:
        if isinstance(end, str):
            end = numpy_to_epoch(np.datetime64(end))
        filter['[t_until'] = end
    #
    return beg, end, filter

def get_period_leases(beg=BEG, end=None):
    #
    ss = GetSlices({'EXPIRED': True, 'DELETED': True}, ['slice_id', 'name', 'family'])
    ds = pd.DataFrame(ss)
    #
    beg, end, filter = convert_beg_end(beg, end)
    #
    ls = GetLeases(filter, ['slice_id', 'name', 't_from', 't_until'])
    dl = pd.DataFrame(ls)
    dl['dt_from'] = pd.to_datetime(dl['t_from'], unit='s')
    dl['dt_until'] = pd.to_datetime(dl['t_until'], unit='s')
    dl.drop(columns=['t_from', 't_until'], inplace=True)
    dl['duration'] = dl['dt_until'] - dl['dt_from']
    #
    merge = dl.merge(ds, on='slice_id', how='left')
    return merge

LEASES = get_period_leases(BEG)

def get_period_events(call_name, beg=BEG, end=None):
    #
    es = GetEvents({'call_name': call_name}, ['message', 'time', 'call', 'call_name'])
    ed = pd.DataFrame(es)
    ed['dt'] = pd.to_datetime(ed['time'], unit='s')
    ed.set_index('dt', inplace=True)
    ed.sort_index(inplace=True)
    #
    return ed.loc[beg:end]

EVENTS = get_period_events('AddLeases', '2023-02-08', '2023-02-13')
# EVENTS = get_period_events('AddLeases', '2010')
EVENTS_HIVE = EVENTS[EVENTS.call.str.lower().str.contains('hive')]


def get_lease_events():
    #
    led =  pd.DataFrame(GetEvents({'call_name': '*Lease*'}, ['message', 'call_name', 'time', 'call']))
    #
    return led

