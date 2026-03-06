# Create your views here.

import json

import pandas as pd

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect
# from django.contrib.admin.views.decorators import staff_member_required

from .models import Stats



# these API-like endpoint is used by the front-end to get the raw usage data

@csrf_protect
def api_all_leases(request):
    # as per urls.py period should be one of 'week', 'month', 'year', 'quarter'
    stats = Stats()
    # a dataframe
    results = stats.all_leases()
    # convert to json
    results = results.to_json(orient='records', default_handler=str)
    response = HttpResponse(results, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_protect
def api_stats_period_barchart(request, periodname, from_period=None, until_period=None):
    # as per urls.py periodname should be one of 'week', 'month', 'year', 'quarter'
    from_ts = pd.Period(from_period if from_period else "2016-01").start_time
    until_ts = pd.Period(until_period).end_time if until_period else pd.Timestamp.now()

    stats = Stats()
    # a dataframe
    results = stats.per_period_barchart(periodname, from_ts, until_ts)
    # convert to json
    results = results.to_json(
        orient='records',
        date_unit='s',
        date_format='iso',
    )
    response = HttpResponse(results, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_protect
def api_stats_slice_csv(request, from_period=None, until_period=None):
    from_readable = from_period if from_period else "2016-01"
    from_ts = pd.Period(from_period).start_time
    until_readable = until_period if until_period else pd.Timestamp.now().strftime("%Y-%m-%d")
    until_ts = pd.Period(until_period).end_time if until_period else pd.Timestamp.now()

    total_hours = (until_ts - from_ts) // pd.Timedelta(1, 'h')
    stats = Stats()
    # a dataframe
    results = stats.per_slice_csv(from_ts, until_ts)
    results['from'] = from_readable
    results['until'] = until_readable
    results['total-hours'] = total_hours
    results = results.to_csv()
    response = HttpResponse(results, content_type="application/csv")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_protect
def api_stats_slice_heatmap(request, from_period=None, until_period=None):
    from_ts = pd.Period(from_period if from_period else "2016-01").start_time
    until_ts = pd.Period(until_period).end_time if until_period else pd.Timestamp.now()

    stats = Stats()
    # a dataframe
    results = stats.per_slice_heatmap(from_ts, until_ts)
    # convert to json
    results = results.to_json(orient='records')
    response = HttpResponse(results, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response
