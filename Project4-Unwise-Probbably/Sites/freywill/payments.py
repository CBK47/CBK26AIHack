"""x402 payment middleware (demo mode)"""
import time
import json
import os
from functools import wraps
from flask import request, jsonify, g
from config import PRICES, WALLET_ADDRESS, CHAIN, CURRENCY, DEMO_MODE, RATE_LIMIT_RPM, RATE_LIMIT_RPH

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
RATE_FILE = os.path.join(DATA_DIR, "rate_limits.json")
TXNS_FILE = os.path.join(DATA_DIR, "transactions.json")


def load_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def check_rate_limit(key: str) -> tuple[bool, str]:
    now = time.time()
    data = load_json(RATE_FILE, {})
    bucket = [t for t in data.get(key, []) if now - t < 3600]
    
    last_minute = [t for t in bucket if now - t < 60]
    if len(last_minute) >= RATE_LIMIT_RPM:
        return False, f"Rate limit: max {RATE_LIMIT_RPM} req/min"
    if len(bucket) >= RATE_LIMIT_RPH:
        return False, f"Rate limit: max {RATE_LIMIT_RPH} req/hour"
    
    bucket.append(now)
    data[key] = bucket
    save_json(RATE_FILE, data)
    return True, ""


def log_transaction(wallet: str, endpoint: str, amount: float):
    txns = load_json(TXNS_FILE, [])
    txns.append({
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "wallet": wallet,
        "endpoint": endpoint,
        "amount": amount,
    })
    save_json(TXNS_FILE, txns)


def payment_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        endpoint = request.path
        price = PRICES.get(endpoint, 0.001)
        
        wallet = request.headers.get("X-Wallet-Address", "")
        rate_key = wallet or request.remote_addr or "anon"
        
        allowed, reason = check_rate_limit(rate_key)
        if not allowed:
            return jsonify({"error": reason}), 429
        
        payment_header = request.headers.get("X-Payment", "")
        
        payment_error = (jsonify({
            "error": "Payment required",
            "payment": {
                "amount": price,
                "currency": CURRENCY,
                "chain": CHAIN,
                "address": WALLET_ADDRESS,
            },
            "discovery": "/.well-known/x402"
        }), 402)

        if DEMO_MODE:
            if payment_header or request.args.get("demo") == "true":
                wallet = wallet or f"demo-{rate_key[:12]}"
                log_transaction(wallet, endpoint, price)
                g.wallet = wallet
                g.tier = "demo"
                return f(*args, **kwargs)
            return payment_error

        # Live mode: require X-Payment header
        if not payment_header:
            return payment_error

        log_transaction(wallet or rate_key, endpoint, price)
        g.wallet = wallet or rate_key
        g.tier = "live"
        return f(*args, **kwargs)
    return decorated
