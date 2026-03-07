#!/usr/bin/env python3
"""
AUTO-MINER — Fallback earnings when agents idle
Mines most profitable coin or rents compute when no other work
"""
import json
import time
import random
import threading
from datetime import datetime
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__)

# Mining state
MINER_STATE = {
    "active": False,
    "coin": None,
    "hashrate": 0.0,
    "earnings_24h": 0.0,
    "start_time": None,
    "total_earnings": 0.0,
    "platform_fees": 0.0,  # 1% platform cut
    "shares_accepted": 0,
    "shares_rejected": 0,
    "payout_address": "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003",  # VAULT treasury (funded!)
}

# Supported coins with mock profitability (real would check whattomine.com)
COINS = {
    "monero": {"algo": "RandomX", "profitable": True, "daily_usd": 0.50, "cpu_only": True},
    "verus": {"algo": "VerusHash", "profitable": True, "daily_usd": 0.30, "cpu_only": True},
    "zeph": {"algo": "Zephyr", "profitable": False, "daily_usd": 0.10, "cpu_only": True},
}

# Mock hashrates for GB10
HASHRATES = {
    "monero": random.uniform(25000, 35000),      # 25-35 kh/s
    "verus": random.uniform(80, 120),             # 80-120 MH/s
}


def auto_switch():
    """Auto-switch to most profitable coin"""
    global MINER_STATE
    
    # Find most profitable CPU coin
    best = max(COINS.items(), key=lambda x: x[1]["daily_usd"] if x[1]["profitable"] else 0)
    
    if MINER_STATE["coin"] != best[0]:
        MINER_STATE["coin"] = best[0]
        MINER_STATE["hashrate"] = HASHRATES.get(best[0], 0)
        MINER_STATE["start_time"] = datetime.now().isoformat()
        print(f"🔄 Switched to {best[0]}: ${best[1]['daily_usd']}/day")


def mining_simulator():
    """Background thread simulating mining"""
    global MINER_STATE
    
    while True:
        if MINER_STATE["active"]:
            # Simulate share finding
            if random.random() < 0.1:  # 10% chance per tick
                MINER_STATE["shares_accepted"] += 1
                share_value = random.uniform(0.0001, 0.001)
                platform_cut = share_value * 0.01  # 1% fee
                MINER_STATE["total_earnings"] += (share_value - platform_cut)
                MINER_STATE["platform_fees"] += platform_cut
            
            # Simulate occasional reject
            if random.random() < 0.01:
                MINER_STATE["shares_rejected"] += 1
            
            # Update 24h projection
            if MINER_STATE["coin"]:
                COINS[MINER_STATE["coin"]]["daily_usd"] *= random.uniform(0.98, 1.02)
                MINER_STATE["earnings_24h"] = COINS[MINER_STATE["coin"]]["daily_usd"]
        
        time.sleep(2)


# Start simulator thread
threading.Thread(target=mining_simulator, daemon=True).start()


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/status")
def status():
    """Get miner status"""
    return jsonify({
        **MINER_STATE,
        "uptime_seconds": int(time.time() - datetime.fromisoformat(MINER_STATE["start_time"]).timestamp()) if MINER_STATE["start_time"] else 0,
        "coins": COINS,
    })


@app.route("/api/start", methods=["POST"])
def start():
    """Start mining"""
    global MINER_STATE
    MINER_STATE["active"] = True
    auto_switch()
    return jsonify({"status": "started", "coin": MINER_STATE["coin"]})


@app.route("/api/stop", methods=["POST"])
def stop():
    """Stop mining"""
    global MINER_STATE
    MINER_STATE["active"] = False
    MINER_STATE["coin"] = None
    MINER_STATE["hashrate"] = 0
    return jsonify({"status": "stopped", "total_earned": MINER_STATE["total_earnings"]})


@app.route("/api/switch/<coin>")
def switch_coin(coin):
    """Manually switch coin"""
    global MINER_STATE
    if coin not in COINS:
        return jsonify({"error": "Unknown coin"}), 400
    
    MINER_STATE["coin"] = coin
    MINER_STATE["hashrate"] = HASHRATES.get(coin, 0)
    return jsonify({"switched_to": coin, "expected_daily": COINS[coin]["daily_usd"]})


@app.route("/api/auto-rental")
def auto_rental():
    """Compare mining vs rental profitability"""
    mining_profit = max(c["daily_usd"] for c in COINS.values())
    rental_profit = 1.00  # Best rental tier
    
    return jsonify({
        "mining_daily": mining_profit,
        "rental_daily": rental_profit,
        "recommendation": "rental" if rental_profit > mining_profit else "mine",
        "margin_percent": ((rental_profit - mining_profit) / mining_profit * 100) if mining_profit > 0 else 0
    })


if __name__ == "__main__":
    print("⛏️  AUTO-MINER on http://0.0.0.0:4003")
    print("   Fallback: Mines when agents idle")
    print("   Auto-switches to most profitable coin")
    app.run(host="0.0.0.0", port=4003, debug=False)
