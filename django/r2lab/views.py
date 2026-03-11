from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse

REACT_DIST = Path(settings.BASE_DIR) / '..' / 'react' / 'dist'


def react_app_view(request):
    """
    Serve the React SPA's index.html for all /react/ routes.
    """
    index = REACT_DIST / 'index.html'
    try:
        return HttpResponse(index.read_text(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse(
            'React app not built. Run: cd react && npm run build',
            status=503,
        )


def verify_email(request):
    """
    Redirect /verify-email?token=... to /react/verify?token=...
    """
    token = request.GET.get('token', '')
    return HttpResponseRedirect(f'/react/verify?token={token}')


def session_context(request):
    """
    Return the session's r2lab_context as JSON (minus the raw JWT).
    """
    r2lab_context = request.session.get('r2lab_context')
    if not r2lab_context:
        return JsonResponse(
            {'error': 'Not authenticated'},
            status=401,
        )

    return JsonResponse({
        'user_details': r2lab_context.get('user_details'),
        'accounts': r2lab_context.get('accounts'),
    })
