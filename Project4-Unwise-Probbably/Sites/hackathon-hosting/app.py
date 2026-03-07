#!/usr/bin/env python3
"""
HACKATHON HOSTING — A2A x402 Platform
For hackathon participants who need quick deployment
"""
import os
import json
import time
import random
import string
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# Config
PROMO_CODES = {
    "TESTINGAI26": {"discount": 100, "uses_left": 1000, "note": "Hackathon testing code"},
}

DEPLOYMENTS = {}
TEMPLATES = [
    {"id": "rouge-edge", "name": "Rouge Edge", "vibe": "Fashion/Editorial", "preview": "rouge-edge.jpg"},
    {"id": "bold-grid", "name": "Bold Grid", "vibe": "Beauty/Lifestyle", "preview": "bold-grid.jpg"},
    {"id": "neon-beat", "name": "Neon Beat", "vibe": "Music/Gaming/Tech", "preview": "neon-beat.jpg"},
    {"id": "grand-vine", "name": "Grand Vine", "vibe": "Luxury Wine/Food", "preview": "grand-vine.jpg"},
    {"id": "wild-canopy", "name": "Wild Canopy", "vibe": "Gourmet/Luxury Food", "preview": "wild-canopy.jpg"},
    {"id": "warm-earth", "name": "Warm Earth", "vibe": "Wellness/Travel/Nature", "preview": "warm-earth.jpg"},
    {"id": "avant-hall", "name": "Avant Hall", "vibe": "Museum/Cultural/Academic", "preview": "avant-hall.jpg"},
    {"id": "pure-craft", "name": "Pure Craft", "vibe": "Interior Design/Furniture", "preview": "pure-craft.jpg"},
    {"id": "dark-lens", "name": "Dark Lens", "vibe": "Photography/Portfolio", "preview": "dark-lens.jpg"},
]

WALLET = "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003"
BASE_PRICE = 0.01  # USDC per day


def generate_slug():
    """Generate random deployment slug"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))


@app.route("/")
def index():
    """Main landing page"""
    return send_from_directory(".", "index.html")


@app.route("/api/templates")
def get_templates():
    """Get available templates"""
    return jsonify({
        "templates": TEMPLATES,
        "count": len(TEMPLATES),
        "note": "All Kimi Website Agent presets available"
    })


@app.route("/api/deploy", methods=["POST"])
def deploy():
    """Deploy a new hackathon site"""
    data = request.json or {}
    
    template_id = data.get("template", "neon-beat")
    project_name = data.get("project_name", "Untitled Hackathon Project")
    description = data.get("description", "")
    promo_code = data.get("promo_code", "")
    wallet = data.get("wallet_address", "")
    
    # Validate template
    template = next((t for t in TEMPLATES if t["id"] == template_id), None)
    if not template:
        return jsonify({"error": "Invalid template"}), 400
    
    # Calculate price
    price = BASE_PRICE
    discount = 0
    
    if promo_code:
        promo = PROMO_CODES.get(promo_code.upper())
        if promo and promo["uses_left"] > 0:
            discount = promo["discount"]
            price = 0 if discount == 100 else price * (1 - discount / 100)
            promo["uses_left"] -= 1
    
    # Generate deployment
    slug = generate_slug()
    deployment_id = f"hack_{int(time.time())}_{slug}"
    
    deployment = {
        "id": deployment_id,
        "slug": slug,
        "template": template,
        "project_name": project_name,
        "description": description,
        "wallet": wallet,
        "price_per_day": price,
        "discount_applied": discount,
        "promo_code": promo_code.upper() if promo_code else None,
        "status": "pending_payment",
        "created": datetime.now().isoformat(),
        "url": f"https://host.aihack26.xyz/{slug}",
        "expires": (datetime.now().timestamp() + 86400 * 3),  # 3 days default
    }
    
    DEPLOYMENTS[deployment_id] = deployment
    
    # If 100% discount, auto-activate
    if discount == 100:
        deployment["status"] = "active"
        deployment["expires"] = (datetime.now().timestamp() + 86400 * 7)  # 7 days for testing
    
    return jsonify({
        "deployment": deployment,
        "payment_required": discount < 100,
        "message": f"Site ready! {'Activated with promo code.' if discount == 100 else 'Pay to activate.'}",
    })


@app.route("/api/deployments/<deployment_id>")
def get_deployment(deployment_id):
    """Get deployment status"""
    dep = DEPLOYMENTS.get(deployment_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404
    
    return jsonify(dep)


@app.route("/api/tip", methods=["POST"])
def tip():
    """Send tip to platform"""
    data = request.json or {}
    amount = data.get("amount", 0.0)
    message = data.get("message", "")
    
    return jsonify({
        "message": "Thank you for the tip!",
        "wallet": WALLET,
        "chain": "base",
        "currency": "USDC",
        "suggested_amounts": [0.1, 0.5, 1.0, 5.0],
        "note": "Tips support hackathon infrastructure",
    })


@app.route("/.well-known/x402")
def discovery():
    """x402 discovery"""
    return jsonify({
        "serviceId": "hackathon-hosting",
        "name": "Hackathon Hosting — A2A Deployment Platform",
        "description": "Deploy hackathon projects instantly. 9 preset templates. Use code TestingAI26 for 100% discount.",
        "version": "1.0.0",
        "paymentAddress": WALLET,
        "chain": "base",
        "currency": "USDC",
        "endpoints": [
            {"path": "/api/deploy", "method": "POST", "price": BASE_PRICE},
            {"path": "/api/tip", "method": "POST", "price": 0},
        ],
        "promoCodes": True,
        "promoNote": "Use TestingAI26 for 100% discount during hackathon",
    })


if __name__ == "__main__":
    print("🚀 HACKATHON HOSTING on http://0.0.0.0:4004")
    print("   Templates: 9 Kimi presets")
    print("   Promo: TestingAI26 = 100% discount")
    app.run(host="0.0.0.0", port=4004, debug=False)
