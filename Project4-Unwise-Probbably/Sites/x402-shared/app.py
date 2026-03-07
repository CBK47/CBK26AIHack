#!/usr/bin/env python3
"""
x402 SHARED PAYMENT SERVICE
Escrow + 1% tax on all swarm transactions
Like a darknet marketplace but for legitimate A2A services
"""
import json
import time
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# Treasury wallet (receives all 1% fees)
TREASURY = "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003"
CHAIN = "base"
CURRENCY = "USDC"

# Transaction registry
TRANSACTIONS = {}
ESCROW = {}
TAX_COLLECTED = 0.0

# Services that use this shared payment
REGISTERED_SERVICES = {
    "freywill": {"name": "FREYWILL AI", "fee_rate": 0.01},
    "compute": {"name": "Compute Rental", "fee_rate": 0.01},
    "miner": {"name": "Auto-Miner", "fee_rate": 0.01},
    "drop": {"name": "Drop & Host", "fee_rate": 0.01},
    "hackathon": {"name": "Hackathon Hosting", "fee_rate": 0.01},
    "openclaw": {"name": "OpenClaw", "fee_rate": 0.01},
}


def generate_tx_id():
    """Generate unique transaction ID"""
    return f"tx_{int(time.time())}_{hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]}"


@app.route("/")
def index():
    """Payment dashboard"""
    return send_from_directory(".", "index.html")


@app.route("/api/services")
def list_services():
    """List all services using shared payment"""
    return jsonify({
        "treasury": TREASURY,
        "tax_rate": "1%",
        "services": REGISTERED_SERVICES,
        "total_services": len(REGISTERED_SERVICES),
    })


@app.route("/api/pay", methods=["POST"])
def process_payment():
    """Process payment with 1% tax"""
    data = request.json or {}
    
    service_id = data.get("service", "")
    amount = float(data.get("amount", 0))
    from_wallet = data.get("from_wallet", "")
    to_wallet = data.get("to_wallet", "")
    description = data.get("description", "")
    
    # Validate
    if service_id not in REGISTERED_SERVICES:
        return jsonify({"error": "Invalid service"}), 400
    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    
    # Calculate tax
    tax_rate = REGISTERED_SERVICES[service_id]["fee_rate"]
    tax_amount = amount * tax_rate
    net_amount = amount - tax_amount
    
    # Create transaction
    tx_id = generate_tx_id()
    transaction = {
        "id": tx_id,
        "service": service_id,
        "amount": amount,
        "tax": tax_amount,
        "tax_rate": tax_rate,
        "net": net_amount,
        "from": from_wallet,
        "to": to_wallet,
        "treasury": TREASURY,
        "description": description,
        "status": "pending",
        "created": datetime.now().isoformat(),
    }
    
    TRANSACTIONS[tx_id] = transaction
    
    global TAX_COLLECTED
    TAX_COLLECTED += tax_amount
    
    return jsonify({
        "transaction": transaction,
        "message": f"Payment of ${amount} USDC with ${tax_amount} tax (1%)",
        "payment_url": f"/pay/{tx_id}",
        "instructions": {
            "step1": f"Send ${amount} USDC to escrow",
            "step2": f"Tax (${tax_amount}) goes to {TREASURY}",
            "step3": f"Net (${net_amount}) released to {to_wallet}",
        }
    })


@app.route("/api/escrow/<tx_id>", methods=["POST"])
def confirm_escrow(tx_id):
    """Confirm payment in escrow"""
    tx = TRANSACTIONS.get(tx_id)
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404
    
    # In production: verify payment on-chain
    tx["status"] = "confirmed"
    tx["confirmed_at"] = datetime.now().isoformat()
    
    return jsonify({
        "transaction": tx,
        "message": "Payment confirmed, releasing funds",
    })


@app.route("/api/stats")
def stats():
    """Treasury stats"""
    total_volume = sum(tx["amount"] for tx in TRANSACTIONS.values())
    total_transactions = len(TRANSACTIONS)
    
    return jsonify({
        "treasury": TREASURY,
        "tax_rate": "1%",
        "tax_collected_usdc": round(TAX_COLLECTED, 4),
        "total_volume_usdc": round(total_volume, 4),
        "total_transactions": total_transactions,
        "services_count": len(REGISTERED_SERVICES),
        "breakdown_by_service": {
            svc: sum(1 for tx in TRANSACTIONS.values() if tx["service"] == svc)
            for svc in REGISTERED_SERVICES.keys()
        }
    })


@app.route("/api/treasury/balance")
def treasury_balance():
    """Check treasury balance (mock for demo)"""
    return jsonify({
        "address": TREASURY,
        "chain": CHAIN,
        "currency": CURRENCY,
        "balance_usdc": round(TAX_COLLECTED, 4),
        "total_collected": round(TAX_COLLECTED, 4),
        "note": "1% tax from all swarm transactions",
    })


@app.route("/.well-known/x402")
def discovery():
    """x402 discovery"""
    return jsonify({
        "serviceId": "x402-shared-pay",
        "name": "x402 Shared Payment Service",
        "description": "Escrow + 1% tax on all A2A transactions. Darknet marketplace vibes, legit services only.",
        "version": "1.0.0",
        "treasury": TREASURY,
        "chain": CHAIN,
        "currency": CURRENCY,
        "tax_rate": "1%",
        "endpoints": [
            {"path": "/api/pay", "method": "POST", "description": "Process payment with tax"},
            {"path": "/api/escrow/<tx_id>", "method": "POST", "description": "Confirm escrow release"},
            {"path": "/api/stats", "method": "GET", "description": "Treasury statistics"},
        ],
        "services": list(REGISTERED_SERVICES.keys()),
    })


if __name__ == "__main__":
    print("💎 x402 SHARED PAY on http://0.0.0.0:4006")
    print("   Treasury:", TREASURY)
    print("   Tax Rate: 1% on all transactions")
    print("   Services:", len(REGISTERED_SERVICES))
    app.run(host="0.0.0.0", port=4006, debug=False)
