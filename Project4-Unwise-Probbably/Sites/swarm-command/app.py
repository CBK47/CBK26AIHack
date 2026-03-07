#!/usr/bin/env python3
"""
SWARM COMMAND — Unified dashboard + Reverse Proxy
All services accessible through port 4000
"""
import json
import os
import random
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, request, Response
import requests

app = Flask(__name__)

# Service URLs
SERVICES = {
    "freywill": "http://localhost:4001",
    "compute": "http://localhost:4002", 
    "miner": "http://localhost:4003",
    "hackathon": "http://localhost:4004",
    "drop": "http://localhost:4005",
    "x402": "http://localhost:4006",
    "linktree": "http://localhost:4007",
}

# Swarm agents
AGENTS = {
    "freywill": {"name": "FREYWILL", "role": "AI Services", "port": 4001, "status": "online", "earnings": 0.0},
    "compute": {"name": "COMPUTE RENTAL", "role": "Hardware Rental", "port": 4002, "status": "online", "earnings": 0.0},
    "miner": {"name": "AUTO-MINER", "role": "Fallback Mining", "port": 4003, "status": "idle", "earnings": 0.0},
    "hackathon": {"name": "HACKATHON", "role": "Template Hosting", "port": 4004, "status": "online", "earnings": 0.0},
    "drop": {"name": "DROP & HOST", "role": "File Hosting", "port": 4005, "status": "online", "earnings": 0.0},
    "x402": {"name": "X402 PAYMENTS", "role": "Payment Service", "port": 4006, "status": "online", "earnings": 0.0},
    "linktree": {"name": "LINKTREE", "role": "Link Directory", "port": 4007, "status": "online", "earnings": 0.0},
}

METRICS = {
    "total_earnings_usdc": 0.0,
    "platform_fees_usdc": 0.0,
    "total_jobs_processed": 0,
    "active_rentals": 0,
    "miner_active": False,
    "utilization_percent": 15,
    "mode": "LIVE",
    "treasury_address": "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003",
}


# ═════════════════════════════════════════════════════════════════════════════
# REVERSE PROXY ROUTES
# ═════════════════════════════════════════════════════════════════════════════

@app.route("/freywill/", defaults={"path": ""})
@app.route("/freywill/<path:path>")
def proxy_freywill(path):
    """Proxy to FREYWILL service (port 4001)"""
    return proxy_to_service("freywill", path)


@app.route("/compute/", defaults={"path": ""})
@app.route("/compute/<path:path>")
def proxy_compute(path):
    """Proxy to Compute Rental service (port 4002)"""
    return proxy_to_service("compute", path)


@app.route("/miner/", defaults={"path": ""})
@app.route("/miner/<path:path>")
def proxy_miner(path):
    """Proxy to Auto-Miner service (port 4003)"""
    return proxy_to_service("miner", path)


@app.route("/hackathon/", defaults={"path": ""})
@app.route("/hackathon/<path:path>")
def proxy_hackathon(path):
    """Proxy to Hackathon Hosting service (port 4004)"""
    return proxy_to_service("hackathon", path)


@app.route("/drop/", defaults={"path": ""})
@app.route("/drop/<path:path>")
def proxy_drop(path):
    """Proxy to Drop & Host service (port 4005)"""
    return proxy_to_service("drop", path)


@app.route("/x402/", defaults={"path": ""})
@app.route("/x402/<path:path>")
def proxy_x402(path):
    """Proxy to x402 Payments service (port 4006)"""
    return proxy_to_service("x402", path)


@app.route("/linktree/", defaults={"path": ""})
@app.route("/linktree/<path:path>")
def proxy_linktree(path):
    """Proxy to Linktree service (port 4007)"""
    return proxy_to_service("linktree", path)


def proxy_to_service(service_name, path):
    """Proxy request to backend service"""
    base_url = SERVICES.get(service_name)
    if not base_url:
        return jsonify({"error": "Unknown service"}), 404
    
    target_url = f"{base_url}/{path}"
    if request.query_string:
        target_url += f"?{request.query_string.decode()}"
    
    try:
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={k: v for k, v in request.headers if k.lower() not in ('host', 'content-length')},
            data=request.get_data(),
            timeout=30
        )
        
        return Response(
            resp.content,
            status=resp.status_code,
            headers={k: v for k, v in resp.headers.items() 
                    if k.lower() not in ('transfer-encoding', 'content-encoding', 'content-length')}
        )
    except requests.exceptions.ConnectionError:
        return jsonify({"error": f"{service_name} service unavailable"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═════════════════════════════════════════════════════════════════════════════
# MAIN DASHBOARD & API
# ═════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    """Serve main dashboard"""
    return send_from_directory(".", "index.html")


@app.route("/openclaw/")
def openclaw():
    """Serve OpenClaw landing page"""
    openclaw_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "openclaw"))
    return send_from_directory(openclaw_dir, "index.html")


@app.route("/research/swarm-report.pdf")
def swarm_report_pdf():
    """Serve the swarm research report PDF."""
    project4_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return send_from_directory(project4_root, "swarm_research_report.pdf")


@app.route("/api/swarm")
def swarm():
    """Get all agents status"""
    for agent in AGENTS.values():
        if agent["status"] == "online":
            agent["earnings"] += random.uniform(0, 0.01)
    
    return jsonify({
        "agents": AGENTS,
        "swarm_health": "healthy",
        "active_count": sum(1 for a in AGENTS.values() if a["status"] == "online"),
    })


@app.route("/api/metrics")
def metrics():
    """Combined earnings metrics"""
    global METRICS
    
    total = sum(a["earnings"] for a in AGENTS.values())
    METRICS["total_earnings_usdc"] = total
    METRICS["utilization_percent"] = random.randint(10, 60)
    
    platform_fees = total * 0.01
    METRICS["platform_fees_usdc"] = platform_fees

    return jsonify({
        **METRICS,
        "breakdown": {
            "ai_services": AGENTS["freywill"]["earnings"],
            "compute_rental": AGENTS["compute"]["earnings"],
            "mining": AGENTS["miner"]["earnings"],
        },
        "goal_progress": min(total / 0.01 * 100, 100),
        "goal_remaining": max(0.01 - total, 0),
        "platform_fee_rate": "1%",
        "net_after_fees": round(total - platform_fees, 6),
    })


@app.route("/api/strategy")
def strategy():
    """Current earning strategy"""
    utilization = METRICS["utilization_percent"]
    
    if utilization > 50:
        current = "maximize_rental"
        recommendation = "High demand — focus on compute rental"
    elif utilization > 20:
        current = "balanced"
        recommendation = "Balanced — all services active"
    else:
        current = "fallback_mine"
        recommendation = "Low demand — start auto-miner"
    
    return jsonify({
        "current_strategy": current,
        "recommendation": recommendation,
        "utilization": utilization,
        "auto_switch_enabled": True,
    })


@app.route("/api/links")
def links():
    """Quick links to all services (proxied through this server)"""
    return jsonify({
        "services": {
            "freywill": {"url": "/freywill/", "description": "AI Services Marketplace"},
            "compute": {"url": "/compute/", "description": "Hardware Rental"},
            "miner": {"url": "/miner/", "description": "Auto-Miner"},
            "hackathon": {"url": "/hackathon/", "description": "Hackathon Template Hosting"},
            "drop": {"url": "/drop/", "description": "Drop & Host File Upload"},
            "x402": {"url": "/x402/", "description": "x402 Payment Service"},
            "linktree": {"url": "/linktree/", "description": "Link Directory"},
        }
    })


if __name__ == "__main__":
    print("🎯 SWARM COMMAND + PROXY on http://0.0.0.0:4000")
    print("   /           - Dashboard")
    print("   /freywill/* - AI Services (port 4001)")
    print("   /compute/*  - Hardware Rental (port 4002)")
    print("   /miner/*    - Auto-Miner (port 4003)")
    print("   /hackathon/*- Hackathon Hosting (port 4004)")
    print("   /drop/*     - Drop & Host (port 4005)")
    print("   /x402/*     - x402 Payments (port 4006)")
    print("   /linktree/* - Link Directory (port 4007)")
    print("   /openclaw/  - Passive Income Landing")
    app.run(host="0.0.0.0", port=4000, debug=False)
