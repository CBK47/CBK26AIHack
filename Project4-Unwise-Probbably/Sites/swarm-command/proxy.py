"""Reverse proxy to route all services through port 5000"""
import requests
from flask import request, Response

# Service ports
SERVICES = {
    "freywill": "http://localhost:4001",
    "compute": "http://localhost:4002",
    "miner": "http://localhost:4003",
    "hackathon": "http://localhost:4004",
    "drop": "http://localhost:4005",
    "x402": "http://localhost:4006",
    "linktree": "http://localhost:4007",
}


def proxy_request(service_name, path=""):
    """Proxy request to backend service"""
    base_url = SERVICES.get(service_name)
    if not base_url:
        return {"error": "Unknown service"}, 404
    
    target_url = f"{base_url}/{path}"
    if request.query_string:
        target_url += f"?{request.query_string.decode()}"
    
    try:
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={k: v for k, v in request.headers if k.lower() not in ('host', 'content-length')},
            data=request.get_data(),
            timeout=30,
            stream=True
        )
        
        return Response(
            resp.iter_content(chunk_size=1024),
            status=resp.status_code,
            headers={k: v for k, v in resp.headers.items() if k.lower() not in ('transfer-encoding', 'content-encoding')}
        )
    except requests.exceptions.ConnectionError:
        return {"error": f"{service_name} service unavailable"}, 503
    except Exception as e:
        return {"error": str(e)}, 500
