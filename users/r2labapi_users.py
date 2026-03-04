"""
The r2lab-api version of the view that answers xhttp requests about users.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from r2lab.testbedapiview import TestbedApiView
from r2lab.r2labapiclient import R2labApiClient
from r2lab.settings import logger

api = R2labApiClient()


def _get_token(request):
    return request.session['r2lab_context']['api_token']


class UsersProxy(TestbedApiView):
    """
    The view that receives /users/ URLs when running against r2lab-api.
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
                return self.get_users(record, token)
            else:
                return self.http_response_from_struct(
                    {'error': f"Unknown verb {verb}"})
        except Exception as exc:
            return self.http_response_from_struct(
                {'error': f"Failure when running verb {verb}",
                 'message': str(exc)})

    def get_users(self, record, token):
        error = self.check_record(record, (), ('urn',))
        if error:
            return self.http_response_from_struct(error)

        users = api.get("/users", token)
        slices = api.get("/slices", token)

        # build a slice lookup by id
        slices_by_id = {s['id']: s for s in slices}

        result = []
        for u in users:
            # build accounts from user's slice_ids
            accounts = []
            for sid in u.get('slice_ids', []):
                s = slices_by_id.get(sid)
                if s:
                    accounts.append({
                        'name': s['name'],
                        'uuid': s['id'],
                        'valid_until': s.get('deleted_at'),
                    })
            accounts.sort(key=lambda a: a['name'])
            result.append({
                'uuid': u['id'],
                'urn': None,
                'email': u['email'],
                'accounts': accounts,
            })

        return self.http_response_from_struct(result)
