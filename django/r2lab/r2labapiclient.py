"""
Thin HTTP client for the r2lab-api (FastAPI REST service).

All API calls use the logged-in user's own JWT token,
obtained at login time via POST /auth/login.
"""

import requests

from r2lab.settings import r2labapi_url, logger

BASE_URL = r2labapi_url.rstrip('/')


class R2labApiClient:

    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url

    def _url(self, path):
        return f"{self.base_url}{path}"

    def _auth_header(self, token):
        return {"Authorization": f"Bearer {token}"}

    def login(self, email, password):
        """
        POST /auth/login with user credentials.
        Returns the access_token string on success, None on failure.
        """
        resp = requests.post(
            self._url("/auth/login"),
            json={"email": email, "password": password},
            timeout=15,
        )
        if resp.status_code != 200:
            logger.error(
                f"r2lab-api login failed status={resp.status_code} "
                f"email={email}"
            )
            return None
        return resp.json().get("access_token")

    def get(self, path, token, **kwargs):
        resp = requests.get(
            self._url(path),
            headers=self._auth_header(token),
            timeout=15,
            **kwargs,
        )
        resp.raise_for_status()
        return resp.json()

    def post(self, path, token, json=None, **kwargs):
        resp = requests.post(
            self._url(path),
            headers=self._auth_header(token),
            json=json,
            timeout=15,
            **kwargs,
        )
        resp.raise_for_status()
        return resp.json()

    def patch(self, path, token, json=None, **kwargs):
        resp = requests.patch(
            self._url(path),
            headers=self._auth_header(token),
            json=json,
            timeout=15,
            **kwargs,
        )
        resp.raise_for_status()
        return resp.json()

    def delete(self, path, token, **kwargs):
        resp = requests.delete(
            self._url(path),
            headers=self._auth_header(token),
            timeout=15,
            **kwargs,
        )
        resp.raise_for_status()
        # DELETE may return empty body
        if resp.content:
            return resp.json()
        return None
