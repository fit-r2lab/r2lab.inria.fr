# ---
# jupyter:
#   jupytext:
#     custom_cell_magics: kql
#     text_representation:
#       extension: .py
#       format_name: percent
#   kernelspec:
#     display_name: usage-statistics
#     language: python
#     name: python3
#   language_info:
#     name: python
#     nbconvert_exporter: python
#     pygments_lexer: ipython3
# ---

# %% [markdown]
# # usage data for R2lab

# %% [markdown]
# ## imports

# %%
from collections import Counter

from pathlib import Path
import json
import getpass

import xmlrpc.client

import numpy as np
import pandas as pd

FORMAT_DATE_TIME = "%Y-%m-%d %H:%M:%S"


# %% [markdown]
# ## families
#
# when a slice has (person from) several families, as a best guess we can tag it with the most relevant one

# %%
# pick the highest-ranking among this list

# %% [markdown]
# #### get the password

# %%
URL = "https://r2labapi.inria.fr:443/PLCAPI/"
ACCOUNT = "root@r2lab.inria.fr"
PASSWORD = None

def get_password():
    global PASSWORD
    if PASSWORD is None:
        try:
            with open("password.txt") as input:
                PASSWORD = input.read().strip()
        except FileNotFoundError:
            PASSWORD = getpass.getpass(f"Enter password for {ACCOUNT} : ")
    return PASSWORD

# %%
type Auth = dict[str, str]
type ServerProxy = xmlrpc.client.ServerProxy

def init_proxy() -> tuple[Auth, ServerProxy]:
    auth = {
        'AuthMethod' : 'password',
        'Username'   : ACCOUNT,
        'AuthString' : get_password(),
    }
    return auth, xmlrpc.client.ServerProxy(URL)

def check_password() -> bool:
    auth, proxy = init_proxy()
    try:
        return proxy.AuthCheck(auth) == 1
    except Exception as e:
        print(f"OOPS, something wrong with {type(e)} - {e}")
        return False

# %%
if not check_password():
    raise RuntimeError("Could not authenticate")

print("Authentication successful")

# %% [markdown]
# #### get entities

# %%
# thanks to plcapi 7.2 this is now something we can retrieve
# from the PLC API, including the deleted and expired ones

# also in order to retrieve the 'family' tag we need to add it
# explicitly to the columns parameter

def get_slices():
    auth, proxy = init_proxy()
    cols = ['slice_id', 'name', 'expires', 'person_ids', 'family']
    return proxy.GetSlices(auth, {'DELETED': True, 'EXPIRED': True}, cols)


# %%
def get_persons():
    auth, proxy = init_proxy()
    cols = ['person_id', 'email', 'first_name', 'last_name', 'slice_ids', 'enabled', 'family']
    return proxy.GetPersons(auth, {}, cols)

# %%
def get_events():
    auth, proxy = init_proxy()
    return proxy.GetEvents(auth, {'call_name': 'AddPersonToSlice'})


# %%
# expose a dataframe ready to be concatenated with the LEASES-EARLY dataframe
def get_leases_df():
    auth, proxy = init_proxy()
    leases = proxy.GetLeases(auth)
    leases_df = pd.DataFrame(leases)[LEASES_COLUMNS1]
    leases_df['beg'] = pd.to_datetime(leases_df['t_from'], unit='s')
    leases_df['end'] = pd.to_datetime(leases_df['t_until'], unit='s')
    leases_df.drop(columns=['t_from', 't_until'], inplace=True)
    return leases_df

# %% [markdown]
# ### how to load the early leases
#
# some point in time circa march 2018, as part of some maintenance cleanup, the unique node has been renamed
# from `37nodes.r2lab.inria.fr` to `faraday.inria.fr`;
# at least that's my conjecture, because GetLeases() has data only from about that time
#
# so in this part we are doing some archeology in the Events database to recover the missing leases, and focus on the ones that were attached to the old nodename
#
# the result is stored in a file `LEASES-EARLY.csv` that we can load here for further iterations

# %%
EARLY_LEASES = "LEASES-EARLY.csv"
# as epoch
LEASES_COLUMNS1 = ['lease_id', 'hostname', 'name', 't_from', 't_until']
# as datetime
LEASES_COLUMNS2 = ['lease_id', 'hostname', 'name', 'beg', 'end']

# %% [markdown]
# #### the AddLease events formats
#
# we fetch the `AddLeases` events and inspect their `call` and `message` fields; so we need to parse that

# %%
# there are several formats for the event's call field

# call, message
addleases_samples = [
    (
        "AddLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, ['37nodes.r2lab.inria.fr'], 'inria_oai.build', 1474542000, 1474556400]"
        ,
        "New leases [1450L] on n=[u'37nodes.r2lab.inria.fr'] s=inria_oai.build [2016-09-22 11:00:00 UTC -> 2016-09-22 15:00:00 UTC]"
    ),
    (
        "AddLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, ['37nodes.r2lab.inria.fr'], 'inria_mario.maintenance', '2016-12-19 14:00:00', '2016-12-19 15:00:00']"
        ,
        "New leases [3502L] on n=[u'37nodes.r2lab.inria.fr'] s=inria_mario.maintenance [2016-12-19 14:00:00 UTC -> 2016-12-19 15:00:00 UTC]"
    ),
    (
        "AddLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, [1], 'inria_r2lab.nightly', 1606615200, 1606618800]"
        ,
        "New leases [10487] on n=['faraday.inria.fr'] s=inria_r2lab.nightly [2020-11-29 02:00:00 UTC -> 2020-11-29 03:00:00 UTC]"
    ),
    (
        "AddLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, ['faraday.inria.fr'], 'inria_hive', '2023-02-08 00:40:00', '2023-02-08 01:40:00']"
        ,
        "New leases [12871] on n=['faraday.inria.fr'] s=inria_hive [2023-02-08 00:40:00 UTC -> 2023-02-08 01:40:00 UTC]"
    ),
    (
        "AddLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, ['faraday.inria.fr'], 'inria_ter01', '2024-02-21 12:30:00', '2024-02-21 12:40:00']"
        ,
        "New leases [13992] on n=['faraday.inria.fr'] s=inria_ter01 [2024-02-21 12:30:00 UTC -> 2024-02-21 12:40:00 UTC]"
    )
]


# %% [markdown]
# #### parse the AddLease event call format

# %%
import re

re_between_quotes = re.compile(r".*'([^']*)'.*")
re_int_in_brackets = re.compile(r".*\[(\d+)\].*")
re_digits_only = re.compile(r"(\d+)[^\d]*$")
re_date = re.compile(r"^[^\d]*(\d+-\d+-\d+)$")
re_time = re.compile(r"^(\d+:\d+:\d+)[^\d]*$")
re_new_lease = re.compile(r"New leases \[(\d+).*")


def parse_addlease_event(call, message):
    try:
        # if this fails, the call has failed - ignore this event
        lease_id = int(re_new_lease.match(message).group(1))
    except AttributeError as e:
        if not message.startswith("New leases []"):
            print(
                f"OOPS: could not parse AddLease event, got exception (1) {type(e)}: {e} with call\n"
                f"{call}\n"
                f"and message\n"
                f"{message}"
            )
        return None, None, None, None, None
    try:
        *_, nodepart, slicepart, frompart, topart = call.split()
        if match := re_digits_only.match(topart):
            # FORMAT 1
            end = pd.to_datetime(match.group(1), unit="s")
            beg = pd.to_datetime(int(re_digits_only.match(frompart).group(1)), unit="s")
        else:
            *_, nodepart, slicepart, fromdate, fromtime, todate, totime = call.split()
            from_string = (
                re_date.match(fromdate).group(1)
                + " "
                + re_time.match(fromtime).group(1)
            )
            to_string = (
                re_date.match(todate).group(1) + " " + re_time.match(totime).group(1)
            )
            beg = pd.to_datetime(from_string, format=FORMAT_DATE_TIME)
            end = pd.to_datetime(to_string, format=FORMAT_DATE_TIME)
        slicename = re_between_quotes.match(slicepart).group(1)
        if match := re_between_quotes.match(nodepart):
            nodename = match.group(1)
        else:
            nodename = re_int_in_brackets.match(nodepart).group(1)
        return lease_id, nodename, slicename, beg, end
    except Exception as e:
        print(
            f"OOPS: could not parse AddLease event, got exception (2) {type(e)}: {e} with call\n"
            f"{call}\n"
            f"and message\n"
            f"{message}"
        )
        return None, None, None, None, None


def test_parse_addlease_event():
    for call, message in addleases_samples:
        print("==== with")
        print(f"{call=}")
        print(f"{message=}")
        print("==>", parse_addlease_event(call, message))

# test_parse_addlease_event()


# %%
# retrieve all the events

def retrieve_added_leases():

    auth, proxy = init_proxy()
    lease_events = proxy.GetEvents(auth, {'call_name': 'AddLeases'})
    df_lease_events = pd.DataFrame(lease_events)

    # parse all calls, returns a Series of tuples
    series = df_lease_events.apply(lambda row: parse_addlease_event(row['call'], row['message']), axis=1)
    # transform into a proper dataframe; use same names as in the API
    as_df = pd.DataFrame(series.tolist(), columns=LEASES_COLUMNS2)
    # keep only the ones corresponding to the historical hostname
    # bad idea, we've been using several names over time
    # as_df = as_df.loc[as_df.hostname == '37nodes.r2lab.inria.fr']
    # drop unsuccesful parses
    as_df.dropna(how="any", axis=0, inplace=True)
    # there are some undefined lease_ids before we filter on the hostname
    as_df['lease_id'] = as_df['lease_id'].astype(int)
    # drop hostname
    as_df.drop(columns=['hostname'], inplace=True)
    return as_df


# %%
additions = retrieve_added_leases()

# %%
# make sure the one of the inria_hive leases is there
# additions[additions.lease_id == 12871]

# %%
additions.dtypes

# %% [markdown]
# #### the UpdateLease events formats

# %%
call_samples = [
    "UpdateLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, [3501], {'t_from': '2016-12-19 07:00:00', 't_until': '2016-12-19 09:00:00'}]"
    , # or
    "UpdateLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, [4183], {'t_from': 1490623200, 't_until': 1490628600}]"
    , # or
    "UpdateLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, [3660], {'t_until': 1484057400}]"
]

# %%
re_update_lease = re.compile(
    r".*\[(?P<lease_id>\d+)\], {('t_from': ('(?P<from_str>.*)'|(?P<from_num>\d+)), )?'t_until': ('(?P<until_str>.*)'|(?P<until_num>\d+)).*"
)

def parse_updatelease_event(call):
    try:
        match = re_update_lease.match(call)
        lease_id = int(match.group('lease_id'))
        if match.group('from_str'):
            beg = pd.to_datetime(match.group('from_str'), format='ISO8601')
        elif match.group('from_num'):
            beg = pd.to_datetime(int(match.group('from_num')), unit='s')
        else:
            beg = None
        if match.group('until_str'):
            end = pd.to_datetime(match.group('until_str'), format='ISO8601')
        elif match.group('until_num'):
            end = pd.to_datetime(int(match.group('until_num')), unit='s')
        else:
            end = None
        return lease_id, beg, end
    except Exception as e:
        print(f"OOPS: could not parse UpdateLease event, got exceptions {type(e)}: {e} with call\n{call}")
        return None, None, None

def test_parse_updatelease_event():
    for sample in call_samples:
        print(parse_updatelease_event(sample))

# test_parse_updatelease_event()


# %% [markdown]
# #### parse the UpdateLease event call format

# %%
additions = retrieve_added_leases()

# %%
additions.head(2)

# %%
additions = retrieve_added_leases()


# %%
def retrieve_updated_leases(additions):
    additions.to_csv("additions-before.csv")
    auth, proxy = init_proxy()
    lease_events = proxy.GetEvents(auth, {'call_name': 'UpdateLeases'})
    df_lease_events = pd.DataFrame(lease_events)
    # parse all calls, returns a Series of tuples
    series = df_lease_events.apply(lambda row: parse_updatelease_event(row['call']), axis=1)
    # transform into a proper dataframe; use same names as in the API
    changes = pd.DataFrame(series.tolist(), columns=['lease_id', 'beg', 'end'])
    changes.to_csv("changes.csv")
    # keep only last record for each lease_id
    changes = changes.groupby('lease_id').last()
    # apply changes
    additions = additions.set_index('lease_id')
    # changes = changes.set_index('lease_id')
    additions.update(changes)
    additions.to_csv("additions-after.csv")
    # just in case
    return changes


# %%

retrieve_updated_leases(additions.copy())

# %% [markdown]
# #### the DeleteLease events formats

# %%
# parsing DeleteLeases events
deleteleases_samples = [
    "DeleteLeases[{'AuthMethod': 'password', 'AuthString': 'Removed by API', 'Username': 'root@r2lab.inria.fr'}, [3563]]",
]

re_delete_lease = re.compile(r".*\[(\d+)\]\]$")

def parse_deletelease_event(call):
    if call.endswith('[]]'):
        return None
    try:
        lease_id = int(re_delete_lease.match(call).group(1))
        return lease_id
    except Exception as e:
        print(f"OOPS: could not parse DeleteLease event, got exceptions {type(e)}: {e} with call\n{call}")
        return None

def test_parse_deletelease_event():
    for call in deleteleases_samples:
        print(f"with {call=}\nwe get {parse_deletelease_event(call)=}")


test_parse_deletelease_event()


# %% [markdown]
# ### parse the DeleteLeases events

# %%
def retrieve_deleted_leases():
    auth, proxy = init_proxy()
    lease_events = proxy.GetEvents(auth, {'call_name': 'DeleteLeases'})
    df_lease_events = pd.DataFrame(lease_events)
    # parse all calls, returns a Series of tuples
    series = df_lease_events.apply(lambda row: parse_deletelease_event(row['call']), axis=1)
    # transform into a proper dataframe; use same names as in the API
    deletions = pd.DataFrame(series, columns=['lease_id'])
    # drop unsuccesful parses
    deletions.dropna(how="any", axis=0, inplace=True)
    # use integers
    deletions['lease_id'] = deletions['lease_id'].astype(int)
    return deletions

deletions = retrieve_deleted_leases()


# %% [markdown]
# #### remove overlaps

# %%
def overlap(b1, e1, b2, e2):
    """
    returns True if the two intervals [b1, e1] and [b2, e2] overlap
    """
    return b1 < e2 and b2 < e1

def test_overlap():
    tests = [
        (False, (1, 2, 3, 4)),
        (False, (3, 4, 1, 2)),
        (False, (1, 2, 2, 3)),
        (False, (2, 3, 1, 2)),
        (True, (1, 3, 2, 4)),
        (True, (2, 4, 1, 3)),
        (True, (1, 4, 2, 3)),
        (True, (2, 3, 1, 4)),
    ]
    for (expected, args) in tests:
        result = overlap(*args)
        # if result != expected:
        print(f"with {args=}, expected {expected} got {result}")

# test_overlap()



# %%

def remove_overlaps(df):
    # starting from the end and moving backbards
    # we keep the last one and consider it the 'reference'
    # then we consider the previous one (so the last but one)
    # if it overlaps, we discard it
    # otherwise we keep it and it becomes the reference
    # and so on
    # this by essence is iterative, so I can't see a way to write it vectorized
    #
    # note that a code that would look at this problem
    # along the following lines does not do the same thing !
    #
    # df['previous_end'] = df['end'].shift(1)
    # df['overlap'] = df['previous_end'] > df['beg']
    # overlap = df.loc[df.overlap]
    #
    df.sort_values(by='end', ascending=False, inplace=True)
    # create tmp column
    df['discard'] = False
    ref = None
    # we must skip the first one
    first = True
    for idx, row in df.iterrows():
        if first:
            first = False
            ref = row
            continue
        if not overlap(row['beg'], row['end'], ref['beg'], ref['end']):
            # no overlap
            ref = row
        else:
            # cannot update through row...
            df.loc[idx, 'discard'] = True
            # print((df.loc[idx]))
    print(f"discarding {df.discard.sum()} leases")
    df.drop(df[df.discard].index, inplace=True)
    df.drop(columns=['discard'], inplace=True)
    df.sort_values(by='beg', ascending=True, inplace=True)
    return df


# %% [markdown]
# #### old leases: putting it all together

# %%
# use cached data if available

# ODD_IDS = [int(x) for x in ['13992', '13990', '13991', '14788', '14791', '14797', '14801', '14823']]
ODD_IDS = [13992]

def debug(df, lease_ids, message):
    print(f"============ {message=}")
    print(f"{df.loc[df.lease_id.isin(lease_ids)]}")

def load_old_leases():
    if Path(EARLY_LEASES).exists():
        df = pd.read_csv(EARLY_LEASES)
        df['beg'] = pd.to_datetime(df['beg'], format='ISO8601')
        df['end'] = pd.to_datetime(df['end'], format='ISO8601')
        return df
    else:
        # print(f"there are {len(deletions)} deleted leases to recover")
        # get additions from events
        old_leases = retrieve_added_leases()
        debug(old_leases, ODD_IDS, "initial additions")
        # consider only the ones deleted
        # old_leases = pd.merge(deletions, old_leases, how="left", on="lease_id")
        # take into account updates
        retrieve_updated_leases(old_leases)
        debug(old_leases, ODD_IDS, "updated")
        # remove overlaps
        remove_overlaps(old_leases)
        debug(old_leases, ODD_IDS, "overlaps")
        # remove duplicates, many leases are found under 2 different lease_ids
        old_leases.drop_duplicates(
            subset=('name', 'beg', 'end'), keep='first', inplace=True)
        # summary
        print(f"we have recovered a total of {len(old_leases)}")
        print(f"and {old_leases.isna().sum()=}")
        old_leases.to_csv(EARLY_LEASES, index=False)
        return old_leases


# %%
resurrected_leases = load_old_leases()
resurrected_leases

# %%
# slicenames = resurrected_leases.name.unique()

# %%
slices_df = pd.DataFrame(get_slices())

slices_df.head()

# %%
df = resurrected_leases.merge(slices_df, left_on='name', right_on='name', how='left')

# %%
untagged = df[df.family.isna()]['name'].unique()
untagged
