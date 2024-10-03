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
def api_usage(request):
    # as per urls.py period should be one of 'week', 'month', 'year', 'quarter'
    stats = Stats()
    # a dataframe
    results = stats.usage()
    # convert to json
    results = results.to_json(orient='records', default_handler=str)
    response = HttpResponse(results, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response

@csrf_protect
def api_usage_per_period(request, period):
    # as per urls.py period should be one of 'week', 'month', 'year', 'quarter'
    stats = Stats()
    # a dataframe
    results = stats.usage_per_period(period)
    # convert to json
    results = results.to_json(orient='records', default_handler=str)
    response = HttpResponse(results, content_type="application/json")
    response['Access-Control-Allow-Origin'] = '*'
    return response
