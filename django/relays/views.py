# views.py
import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

FASTAPI_BASE_URL = "http://faraday.inria.fr:8000/api/v1"

@csrf_exempt  # because this endpoint is a pass-through
def relays_temperatures(request):
    """
    Proxy endpoint: forward POST JSON body to FastAPI backend.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    # Forward the JSON body (if any)
    try:
        json_body = json.loads(request.body) if request.body else {}
    except Exception as exc:
        return JsonResponse({"error": f"invalid JSON: {type(exc)}: {exc}"}, status=400)

    try:
        response = requests.post(
            f"{FASTAPI_BASE_URL}/relays/temperatures",
            json=json_body,
            timeout=10,
        )
    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=502)

    # Relay the FastAPI response
    try:
        data = response.json()
    except ValueError:
        # FastAPI returned something non-JSON
        return JsonResponse({"error": "non-JSON response from backend"}, status=502)

    return JsonResponse(data, safe=False, status=response.status_code)
