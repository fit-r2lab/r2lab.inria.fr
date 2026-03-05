"""
The r2lab-api version of the view that answers proxy API calls about slices.
"""

import time
from datetime import datetime, timezone

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from r2lab.testbedapiview import TestbedApiView
from r2lab.r2labapiclient import R2labApiClient
from r2lab.settings import logger

api = R2labApiClient()


def _get_token(request):
    return request.session['r2lab_context']['api_token']


class SlicesProxy(TestbedApiView):
    """
    The view that receives /slices/ URLs when running against r2lab-api.
    """

    @method_decorator(csrf_protect)
    def post(self, request, verb):
        auth_error = self.not_authenticated_error(request)
        if auth_error:
            return auth_error
        try:
            record = self.decode_body_as_json(request)
            token = _get_token(request)
            if verb == 'get':
                return self.get_slices(record, token)
            elif verb == 'renew':
                return self.renew_slice(record, token)
            else:
                return self.http_response_from_struct(
                    {'error': f"Unknown verb {verb}"})
        except Exception as exc:
            import traceback
            traceback.print_exc()
            return self.http_response_from_struct(
                {'error': f"Failure when running verb {verb}",
                 'message': str(exc)})

    @staticmethod
    def _return_slice(api_slice):
        return {
            'name': api_slice['name'],
            'valid_until': api_slice.get('deleted_at'),
        }

    def get_slices(self, record, token):
        error = self.check_record(record, (), ('names',))
        if error:
            return self.http_response_from_struct(error)

        slices = api.get("/slices", token)

        # filter by names if provided
        if 'names' in record:
            requested = set(record['names'])
            slices = [s for s in slices if s['name'] in requested]

        result = [self._return_slice(s) for s in slices]
        result.sort(key=lambda s: s['valid_until'] or '')
        return self.http_response_from_struct(result)

    def renew_slice(self, record, token):
        error = self.check_record(record, ('name',), ('valid_until',))
        if error:
            return self.http_response_from_struct(error)

        # find slice_id from name
        slices = api.get("/slices", token)
        slice_id = None
        for s in slices:
            if s['name'] == record['name']:
                slice_id = s['id']
                break
        if slice_id is None:
            return self.http_response_from_struct(
                {'error': f"Could not find slice {record['name']}"})

        if 'valid_until' in record:
            new_expiry = record['valid_until']
        else:
            # 2 months = 61 days from now
            day = 24 * 3600
            new_expiry = datetime.fromtimestamp(
                time.time() + 61 * day, tz=timezone.utc
            ).isoformat()

        updated = api.patch(
            f"/slices/{slice_id}", token,
            json={'deleted_at': new_expiry},
        )
        return self.http_response_from_struct(self._return_slice(updated))
