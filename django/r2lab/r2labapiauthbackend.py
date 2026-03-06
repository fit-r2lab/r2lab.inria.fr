#!/usr/bin/env python3

"""
Authentication backend that validates credentials against r2lab-api.
"""

from django.contrib.auth.models import User

from r2lab.settings import logger
from r2lab.r2labapiclient import R2labApiClient


class R2labApiAuthBackend:
    """
    Authenticate against the r2lab-api (FastAPI REST service).

    1. POST /auth/login  → access_token
    2. GET  /users/me    → user details
    3. GET  /slices?mine=true → user's slices
    """

    def __init__(self):
        self.api = R2labApiClient()

    # Required for the backend to work properly
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def authenticate(self, *args, **kwds):
        token = kwds.get('token')
        if token is None:
            return

        try:
            email = token['username']
            password = token['password']
            request = token['request']

            logger.info(f"authenticating {email} via r2lab-api")

            # 1. validate credentials
            access_token = self.api.login(email, password)
            if not access_token:
                logger.error(f"r2lab-api login failed for email={email}")
                return None

            # 2. fetch user details
            me = self.api.get("/users/me", access_token)
            user_details = {
                'email': me['email'],
                'firstname': me.get('first_name', ''),
                'lastname': me.get('last_name', ''),
                'is_admin': me.get('is_admin', False),
            }

            # 3. fetch user's slices
            slices = self.api.get("/slices", access_token,
                                  params={"mine": "true"})
            accounts = []
            for s in slices:
                accounts.append({
                    'name': s['name'],
                    'valid_until': s.get('deleted_at'),
                })
            accounts.sort(key=lambda a: a['name'])

            # store in session
            request.session['r2lab_context'] = {
                'user_details': user_details,
                'accounts': accounts,
                'api_token': access_token,
            }

        except Exception:
            logger.exception("ERROR in r2lab-api Auth Backend")
            return None

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.info(f"Creating django user object for email={email}")
            user = User.objects.create_user(email, email, 'passworddoesntmatter')

        if user_details.get('firstname'):
            user.first_name = user_details['firstname']
        if user_details.get('lastname'):
            user.last_name = user_details['lastname']
        user.save()

        return user
