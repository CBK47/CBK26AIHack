#!/usr/bin/env python3
"""
COMPUTE RENTAL - Rent GB10 Superchip cycles
Flashy dashboard for renting GPU/CPU time when agents are idle
"""
import json
import time
import random
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

# Hardware specs
HARDWARE = {
    "name": "NVIDIA GB10 Grace Blackwell",
    "cpu_cores": 20,
    "ram_gb": 128,
    "gpu": "Blackwell GPU",
    "gpu_memory_gb": 128,  # Shared unified memory
    "location": "Local Edge",
    "uptime_percent": 99.9
}

# Pricing (per hour)
PRICING = {
    "inference_120b": 0.50,    # $0.50/hr for 120B model access
    "inference_32b": 0.20,     # $0.20/hr for 32B coder
    "cpu_compute": 0.10,       # $0.10/hr for CPU tasks
    "full_gpu": 1.00,          # $1.00/hr for full GPU access
}

# VAULT treasury address (now funded!)
VAULT_ADDRESS = "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003"

# Mock jobs database
JOBS = []
EARNINGS = 0.0


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/hardware")
def hardware():
    """Get hardware specs"""
    return jsonify({
        **HARDWARE,
        "status": "online",
        "current_load": random.randint(10, 40),  # Mock load
        "available_for_rent": True
    })


@app.route("/api/pricing")
def pricing():
    """Get pricing tiers"""
    return jsonify({
        "tiers": [
            {"id": "inference_120b", "name": "120B Inference", "price_hourly": 0.50, 
             "description": "Access to gpt-oss:120b for text generation"},
            {"id": "inference_32b", "name": "32B Code", "price_hourly": 0.20,
             "description": "Qwen2.5-Coder:32b for code tasks"},
            {"id": "cpu_compute", "name": "CPU Compute", "price_hourly": 0.10,
             "description": "20-core ARM CPU for general compute"},
            {"id": "full_gpu", "name": "Full GPU", "price_hourly": 1.00,
             "description": "Full Blackwell GPU access"},
        ],
        "currency": "USDC",
        "chain": "base"
    })


@app.route("/api/rent", methods=["POST"])
def rent():
    """Rent compute time"""
    data = request.json or {}
    tier = data.get("tier", "inference_32b")
    hours = min(float(data.get("hours", 1)), 24)  # Max 24h
    
    if tier not in PRICING:
        return jsonify({"error": "Invalid tier"}), 400
    
    cost = PRICING[tier] * hours
    platform_fee = cost * 0.01  # 1% platform fee
    job_id = f"job_{int(time.time())}_{random.randint(1000,9999)}"
    
    job = {
        "id": job_id,
        "tier": tier,
        "hours": hours,
        "cost": cost,
        "status": "active",
        "started": datetime.now().isoformat(),
        "ends": (datetime.now().timestamp() + hours * 3600),
        "payment_address": VAULT_ADDRESS
    }
    JOBS.append(job)
    
    return jsonify({
        "job": job,
        "message": f"Rented {tier} for {hours}h. Pay {cost} USDC to activate.",
        "payment_required": True,
        "platform_fee": {
            "percent": 1,
            "amount": round(platform_fee, 4),
            "note": "1% platform fee supports swarm operations"
        }
    })


@app.route("/api/jobs")
def jobs():
    """List active rental jobs"""
    return jsonify({
        "active": len([j for j in JOBS if j["status"] == "active"]),
        "completed": len([j for j in JOBS if j["status"] == "completed"]),
        "jobs": JOBS[-10:]  # Last 10
    })


@app.route("/api/earnings")
def earnings():
    """Get earnings stats"""
    global EARNINGS
    # Simulate some earnings
    EARNINGS += random.uniform(0.001, 0.01)
    return jsonify({
        "total_earnings_usdc": round(EARNINGS, 4),
        "today_earnings": round(random.uniform(0.1, 2.0), 2),
        "active_rentals": len([j for j in JOBS if j["status"] == "active"]),
        "utilization_percent": random.randint(20, 80)
    })


@app.route("/api/status")
def status():
    """Full system status"""
    return jsonify({
        "hardware": HARDWARE,
        "load": {
            "cpu": random.randint(10, 30),
            "ram": random.randint(20, 50),
            "gpu": random.randint(5, 25)
        },
        "available": True,
        "next_available": None,
        "queue_length": 0
    })


if __name__ == "__main__":
    print("🖥️  COMPUTE RENTAL on http://0.0.0.0:4002")
    app.run(host="0.0.0.0", port=4002, debug=False)
