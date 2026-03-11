"""
Generic reverse proxy for the r2lab-api.

Forwards requests from /r2labapi/<path> to the r2lab-api backend,
injecting the Bearer token from the Django session.
"""

import requests

from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_protect

from r2lab.settings import r2labapi_settings

BASE_URL = r2labapi_settings['url'].rstrip('/')


class ApiProxy(View):

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        r2lab_context = request.session.get('r2lab_context')
        if not r2lab_context or 'api_token' not in r2lab_context:
            return JsonResponse({'error': 'User is not authenticated'},
                                status=401)
        token = r2lab_context['api_token']
        path = kwargs.get('path', '')
        url = f"{BASE_URL}/{path}"

        headers = {
            'Authorization': f'Bearer {token}',
        }
        content_type = request.content_type
        if content_type:
            headers['Content-Type'] = content_type

        try:
            resp = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                params=request.GET,
                data=request.body if request.body else None,
                timeout=30,
            )
        except requests.RequestException as exc:
            return JsonResponse(
                {'error': f'API request failed: {exc}'},
                status=502,
            )

        return HttpResponse(
            content=resp.content,
            status=resp.status_code,
            content_type=resp.headers.get('Content-Type', 'application/json'),
        )
