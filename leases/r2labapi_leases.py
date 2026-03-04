"""
The r2lab-api version of the view that answers xhttp requests about leases.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from r2lab.testbedapiview import TestbedApiView
from r2lab.r2labapiclient import R2labApiClient
from r2lab.settings import r2labapi_settings, logger

api = R2labApiClient()

# cache the resource_id for the configured resource
_resource_id_cache = {}


def _get_resource_id(token):
    resource_name = r2labapi_settings.get('resource_name', 'r2lab.inria.fr')
    if resource_name in _resource_id_cache:
        return _resource_id_cache[resource_name]
    resources = api.get("/resources", token)
    for r in resources:
        if r['name'] == resource_name:
            _resource_id_cache[resource_name] = r['id']
            return r['id']
    raise ValueError(f"Resource '{resource_name}' not found in r2lab-api")


def _get_token(request):
    return request.session['r2lab_context']['api_token']


class LeasesProxy(TestbedApiView):
    """
    The view that receives /leases/ URLs when running against r2lab-api.
    """

    @method_decorator(csrf_protect)
    def post(self, request, verb):
        auth_error = self.not_authenticated_error(request)
        if auth_error:
            return auth_error
        try:
            record = self.decode_body_as_json(request)
            token = _get_token(request)
            if verb == 'add':
                return self.add_lease(record, token)
            elif verb == 'update':
                return self.update_lease(record, token)
            elif verb == 'delete':
                return self.delete_lease(record, token)
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
    def _return_lease(lease):
        return {
            'uuid': lease['id'],
            'slicename': lease['slice_name'],
            'valid_from': lease['t_from'],
            'valid_until': lease['t_until'],
            'ok': True,
        }

    def add_lease(self, record, token):
        error = self.check_record(
            record, ('slicename', 'valid_from', 'valid_until'), ())
        if error:
            return self.http_response_from_struct(error)

        # resolve slice_id from slice name
        slices = api.get("/slices", token)
        slice_id = None
        for s in slices:
            if s['name'] == record['slicename']:
                slice_id = s['id']
                break
        if slice_id is None:
            return self.http_response_from_struct(
                {'error': f"Slice '{record['slicename']}' not found"})

        resource_id = _get_resource_id(token)
        lease = api.post("/leases", token, json={
            'resource_id': resource_id,
            'slice_id': slice_id,
            't_from': record['valid_from'],
            't_until': record['valid_until'],
        })
        return self.http_response_from_struct(self._return_lease(lease))

    def update_lease(self, record, token):
        error = self.check_record(
            record, ('uuid',), ('valid_from', 'valid_until'))
        if error:
            return self.http_response_from_struct(error)

        payload = {}
        if 'valid_from' in record:
            payload['t_from'] = record['valid_from']
        if 'valid_until' in record:
            payload['t_until'] = record['valid_until']

        lease = api.patch(f"/leases/{record['uuid']}", token, json=payload)
        return self.http_response_from_struct(self._return_lease(lease))

    def delete_lease(self, record, token):
        error = self.check_record(record, ('uuid',), ())
        if error:
            return self.http_response_from_struct(error)
        try:
            api.delete(f"/leases/{record['uuid']}", token)
            return self.http_response_from_struct({'ok': True})
        except Exception:
            return self.http_response_from_struct({'ok': False})
