"""R2lab URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  re_path(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  re_path(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, re_path
    2. Add a URL to urlpatterns:  re_path(r'^news/', include('news.urls'))
"""
from django.urls import include, re_path
from django.contrib import admin

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic.base import RedirectView

import md.views
import mfauth.views
import leases.views
import slices.views
import users.views
import keys.views
import stats.views

from pathlib import Path

BASE = Path(settings.BASE_DIR)

urlpatterns = [
    # default: empty or just / -> md/index.md
    re_path(r'^(/)?$', RedirectView.as_view(url='/index.md', permanent=False)),
    # no subdir
    re_path(r'^(?P<markdown_file>[^/]*)$', md.views.markdown_page),
    re_path(r'^md/(?P<markdown_file>.*)$', md.views.markdown_page),
    re_path(r'^login/', mfauth.views.Login.as_view()),
    re_path(r'^logout/', mfauth.views.Logout.as_view()),
    re_path(r'^leases/(?P<verb>(add|update|delete))', leases.views.LeasesProxy.as_view()),
    re_path(r'^slices/(?P<verb>(get|renew))', slices.views.SlicesProxy.as_view()),
    re_path(r'^users/(?P<verb>(get|renew))', users.views.UsersProxy.as_view()),
    re_path(r'^keys/(?P<verb>(get|add|delete))', keys.views.KeysProxy.as_view()),

    re_path(r'^stats.md/'
            r'(?P<by>slice|year|quarter|month|week|day)'
            r'(/(?P<from_period>[0-9-]+))?'
            r'(/(?P<until_period>[0-9-]+))?'
            r'/?$', md.views.markdown_page, {'markdown_file': 'stats.md'}),
    # API endpoints for stats
    re_path(r'^api/stats/period'
            r'/(?P<periodname>(day|week|month|year|quarter))'
            r'(/(?P<from_period>[0-9-]+))?'
            r'(/(?P<until_period>[0-9-]+))?'
            r'/?$', stats.views.api_stats_period_barchart),

    re_path(r'^api/stats/slice'
            r'(/(?P<from_period>[0-9-]+))?'
            r'(/(?P<until_period>[0-9-]+))?'
            r'/?$', stats.views.api_stats_slice_heatmap),

    re_path(r'^api/stats/slice/csv'
            r'(/(?P<from_period>[0-9-]+))?'
            r'(/(?P<until_period>[0-9-]+))?'
            r'/?$', stats.views.api_stats_slice_csv),

    re_path(r'^api/stats/lease/?$',
            stats.views.api_all_leases),
]
urlpatterns.extend(static('/assets/', document_root=str(BASE / 'assets/')))
urlpatterns.extend(static('/raw/', document_root=str(BASE / 'raw/')))
urlpatterns.extend(static('/code/', document_root=str(BASE / 'code/')))
