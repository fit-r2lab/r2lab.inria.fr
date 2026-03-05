"""
The r2lab-api version of the view that answers proxy API calls about keys.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from r2lab.testbedapiview import TestbedApiView
from r2lab.r2labapiclient import R2labApiClient
from r2lab.settings import logger

api = R2labApiClient()


def _get_token(request):
    return request.session['r2lab_context']['api_token']


class KeysProxy(TestbedApiView):
    """
    The view that receives /keys/ URLs when running against r2lab-api.
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
                return self.get_keys(record, token)
            elif verb == 'add':
                return self.add_key(record, token)
            elif verb == 'delete':
                return self.delete_key(record, token)
            else:
                return self.http_response_from_struct(
                    {'error': f"Unknown verb {verb}"})
        except Exception as exc:
            return self.http_response_from_struct(
                {'error': f"Failure when running verb {verb}",
                 'message': str(exc)})

    def _get_user_id(self, token):
        me = api.get("/users/me", token)
        return me['id']

    def get_keys(self, record, token):
        user_id = self._get_user_id(token)
        keys = api.get(f"/users/{user_id}/keys", token)
        result = [
            {'uuid': k['id'], 'ssh_key': k['key']}
            for k in keys
        ]
        return self.http_response_from_struct(result)

    def add_key(self, record, token):
        error = self.check_record(record, ('key',), ())
        if error:
            return self.http_response_from_struct(error)
        user_id = self._get_user_id(token)
        new_key = api.post(
            f"/users/{user_id}/keys", token,
            json={'key': record['key']},
        )
        return self.http_response_from_struct(
            {'uuid': new_key['id']})

    def delete_key(self, record, token):
        error = self.check_record(record, ('uuid',), ())
        if error:
            return self.http_response_from_struct(error)
        user_id = self._get_user_id(token)
        try:
            api.delete(f"/users/{user_id}/keys/{record['uuid']}", token)
            return self.http_response_from_struct({'ok': True})
        except Exception:
            return self.http_response_from_struct({'ok': False})
