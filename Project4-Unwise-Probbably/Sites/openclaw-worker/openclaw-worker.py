#!/usr/bin/env python3
"""
OPENCLAW Worker - Passive income from idle hardware
Monitors idle time, mines crypto, processes AI tasks
"""
import os
import sys
import time
import json
import random
import subprocess
import threading
from datetime import datetime
from pathlib import Path

# Config
CONFIG_DIR = Path("/opt/openclaw/config")
DATA_DIR = Path("/opt/openclaw/data")
LOG_FILE = Path("/var/log/openclaw.log")
CONFIG_FILE = CONFIG_DIR / "config.json"

# Default config
DEFAULT_CONFIG = {
    "wallet_address": "",  # User sets this
    "idle_threshold_minutes": 5,
    "max_cpu_percent": 80,
    "mining_enabled": True,
    "ai_tasks_enabled": True,
    "platform_fee_percent": 1,
    "swarm_endpoint": "https://land-comfortable-director-arabic.trycloudflare.com",
    "coins": ["monero", "verus"],
    "auto_switch": True,
}

# Mining state
STATE = {
    "active": False,
    "current_coin": None,
    "idle_minutes": 0,
    "total_earnings": 0.0,
    "platform_fees": 0.0,
    "shares": 0,
    "start_time": None,
    "session_earnings": 0.0,
}


def log(msg):
    """Log to file and stdout"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except:
        pass


def load_config():
    """Load user config"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    return DEFAULT_CONFIG


def save_config(config):
    """Save user config"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)


def get_idle_time():
    """Get system idle time in minutes (X11)"""
    try:
        # Try xprintidle first (milliseconds)
        result = subprocess.run(
            ["xprintidle"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            milliseconds = int(result.stdout.strip())
            return milliseconds / 1000 / 60  # Convert to minutes
    except:
        pass
    
    # Fallback: check /dev/input idle (rough estimate)
    try:
        stat = os.stat("/dev/input")
        idle_seconds = time.time() - stat.st_atime
        return idle_seconds / 60
    except:
        pass
    
    return 0  # Assume active if we can't detect


def get_cpu_load():
    """Get current CPU load"""
    try:
        with open("/proc/loadavg") as f:
            load = float(f.read().split()[0])
        # Convert to percentage (rough)
        cpus = os.cpu_count() or 1
        return (load / cpus) * 100
    except:
        return 50  # Assume moderate load


def should_mine(config):
    """Check if we should start mining"""
    idle = get_idle_time()
    cpu = get_cpu_load()
    
    # Start if idle threshold met and CPU not overloaded
    if idle >= config["idle_threshold_minutes"] and cpu < config["max_cpu_percent"]:
        return True
    return False


def simulate_mining(config):
    """Simulate mining (for POC) - in production would use xmrig/verus-miner"""
    global STATE
    
    if not STATE["active"]:
        STATE["active"] = True
        STATE["start_time"] = datetime.now().isoformat()
        STATE["current_coin"] = random.choice(config["coins"])
        log(f"⛏️  Started mining {STATE['current_coin']}")
    
    # Simulate finding shares
    if random.random() < 0.1:  # 10% chance per tick
        share_value = random.uniform(0.00001, 0.0001)
        platform_cut = share_value * (config["platform_fee_percent"] / 100)
        
        STATE["shares"] += 1
        STATE["session_earnings"] += (share_value - platform_cut)
        STATE["platform_fees"] += platform_cut
        STATE["total_earnings"] += (share_value - platform_cut)
        
        log(f"💰 Share found! +${share_value:.6f} (net: ${share_value - platform_cut:.6f})")
    
    # Occasionally switch coins
    if config["auto_switch"] and random.random() < 0.05:
        new_coin = random.choice(config["coins"])
        if new_coin != STATE["current_coin"]:
            log(f"🔄 Switching from {STATE['current_coin']} to {new_coin}")
            STATE["current_coin"] = new_coin


def process_ai_task(config):
    """Process AI task if available (placeholder)"""
    # In production: poll swarm for tasks, process with local inference
    if random.random() < 0.02:  # 2% chance per tick
        task_value = random.uniform(0.001, 0.01)
        platform_cut = task_value * (config["platform_fee_percent"] / 100)
        
        STATE["session_earnings"] += (task_value - platform_cut)
        STATE["platform_fees"] += platform_cut
        STATE["total_earnings"] += (task_value - platform_cut)
        
        log(f"🤖 AI task completed! +${task_value:.4f}")


def stop_mining():
    """Stop mining session"""
    global STATE
    
    if STATE["active"]:
        duration = (datetime.now() - datetime.fromisoformat(STATE["start_time"])).seconds / 60
        log(f"🛑 Mining stopped. Session: {duration:.1f}min, Earned: ${STATE['session_earnings']:.6f}")
        
        STATE["active"] = False
        STATE["current_coin"] = None
        STATE["session_earnings"] = 0.0
        STATE["start_time"] = None


def report_status(config):
    """Report status to swarm dashboard"""
    try:
        import requests
        payload = {
            "worker_id": os.uname().nodename,
            "wallet": config["wallet_address"],
            "active": STATE["active"],
            "coin": STATE["current_coin"],
            "total_earnings": STATE["total_earnings"],
            "platform_fees": STATE["platform_fees"],
            "shares": STATE["shares"],
        }
        # In production: POST to swarm endpoint
        # requests.post(f"{config['swarm_endpoint']}/api/workers/report", json=payload)
    except:
        pass


def main():
    """Main worker loop"""
    log("🐾 OPENCLAW Worker starting...")
    
    # Setup
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    config = load_config()
    
    if not config["wallet_address"]:
        log("⚠️  No wallet address configured!")
        log("   Set your wallet: sudo openclaw-config --wallet 0x...")
        log("   Running in demo mode (earnings not saved)")
    
    log(f"   Idle threshold: {config['idle_threshold_minutes']} minutes")
    log(f"   Max CPU: {config['max_cpu_percent']}%")
    log(f"   Platform fee: {config['platform_fee_percent']}%")
    log("")
    
    try:
        while True:
            config = load_config()  # Reload for live updates
            
            if should_mine(config):
                if config["mining_enabled"]:
                    simulate_mining(config)
                if config["ai_tasks_enabled"]:
                    process_ai_task(config)
            else:
                if STATE["active"]:
                    stop_mining()
                elif int(time.time()) % 60 == 0:  # Log every minute
                    idle = get_idle_time()
                    log(f"💤 Idle: {idle:.1f}min, waiting for {config['idle_threshold_minutes']}min threshold...")
            
            # Report status every 5 minutes
            if int(time.time()) % 300 == 0:
                report_status(config)
            
            time.sleep(5)  # 5 second tick
            
    except KeyboardInterrupt:
        log("\n👋 Shutting down...")
        stop_mining()
        log(f"   Total earned: ${STATE['total_earnings']:.6f}")
        log(f"   Platform fees: ${STATE['platform_fees']:.6f}")


if __name__ == "__main__":
    main()
