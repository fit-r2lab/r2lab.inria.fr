from django.contrib.auth import authenticate, login, logout
from django.views.generic import View
from django.http import HttpResponseRedirect

import md.views
from r2lab.settings import logger


class Login(View):

    def post(self, request):
        username = request.POST.get('username')
        password = request.POST.get('password')

        # pass request within the token, so the auth backend can
        # attach r2lab_context to the request session.
        token = {'username': username,
                 'password': password,
                 'request': request}

        # authentication occurs through the backend
        # returns a django User on success, or None on failure
        user = authenticate(token=token)

        env = {}
        if user is None:
            env['login_message'] = "incorrect username and/or password"
            return md.views.markdown_page(request, 'index', env)
        elif not user.is_active:
            env['login_message'] = "this user is inactive"
            return md.views.markdown_page(request, 'index', env)
        elif 'r2lab_context' not in request.session:
            logger.error("Internal error - cannot retrieve r2lab_context")
            env['login_message'] = "cannot log you in - please get in touch with admin"
            return md.views.markdown_page(request, 'oops', env)
        else:
            logger.debug("login for user={}".format(user))
            login(request, user)
            return HttpResponseRedirect("/run.md")

    def http_method_not_allowed(self, request):
        env = {'login_message': 'HTTP method not allowed'}
        return md.views.markdown_page(request, 'oops', env)


class Logout(View):

    def get(self, request):
        env = {}
        if 'r2lab_context' not in request.session or \
                'user_details' not in request.session['r2lab_context']:
            env['login_message'] = 'cannot logout (not logged in)'
            return md.views.markdown_page(request, 'index', env)
        logout(request)
        return HttpResponseRedirect("/")

    def http_method_not_allowed(self, request):
        env = {'login_message': 'HTTP method not allowed'}
        return md.views.markdown_page(request, 'oops', env)
