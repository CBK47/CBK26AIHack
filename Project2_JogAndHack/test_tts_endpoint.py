#!/usr/bin/env python3
"""
test_tts_endpoint.py — Unit tests for the GX10 TTS endpoint.
Run from the Mac or GX10:
  python3 test_tts_endpoint.py [--host 192.168.0.28] [--port 2002]
"""

import argparse
import sys
import time
import requests

parser = argparse.ArgumentParser()
parser.add_argument("--host", default="192.168.0.28")
parser.add_argument("--port", default=2002, type=int)
args = parser.parse_args()

BASE = f"http://{args.host}:{args.port}"
PASS = 0
FAIL = 0


def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}{': ' + detail if detail else ''}")
        FAIL += 1


print(f"\nTTS Endpoint Tests -> {BASE}\n")

# 1. Health check
try:
    r = requests.get(f"{BASE}/health", timeout=5)
    check("Health endpoint returns 200", r.status_code == 200)
    body = r.json()
    check("Health body has status=ok", body.get("status") == "ok")
    check("Health body has voice_loaded field", "voice_loaded" in body)
    print(f"         voice_loaded={body.get('voice_loaded')}")
except Exception as e:
    check("Health endpoint reachable", False, str(e))
    print("\nServer unreachable — aborting remaining tests.")
    sys.exit(1)

# 2. TTS synthesis — default voice
try:
    t0 = time.time()
    r = requests.post(f"{BASE}/tts",
                      json={"text": "Hello, this is a test of the voice synthesis system.", "voice": "default"},
                      timeout=30)
    latency_ms = (time.time() - t0) * 1000
    check("TTS default voice returns 200", r.status_code == 200)
    check("TTS response is audio/wav", "audio/wav" in r.headers.get("Content-Type", ""))
    check("TTS audio has content", len(r.content) > 1000)
    check(f"TTS latency under 2000ms ({int(latency_ms)}ms)", latency_ms < 2000)
except Exception as e:
    check("TTS default voice request", False, str(e))

# 3. TTS synthesis — Sabrina voice
try:
    t0 = time.time()
    r = requests.post(f"{BASE}/tts",
                      json={"text": "Sabrina voice clone test.", "voice": "sabrina"},
                      timeout=30)
    latency_ms = (time.time() - t0) * 1000
    check("TTS Sabrina voice returns 200", r.status_code == 200)
    check("TTS Sabrina audio has content", len(r.content) > 1000)
    check(f"TTS Sabrina latency under 2000ms ({int(latency_ms)}ms)", latency_ms < 2000)
except Exception as e:
    check("TTS Sabrina voice request", False, str(e))

# 4. Edge cases
try:
    r = requests.post(f"{BASE}/tts", json={"text": ""}, timeout=5)
    check("Empty text returns 400", r.status_code == 400)
except Exception as e:
    check("Empty text validation", False, str(e))

try:
    r = requests.post(f"{BASE}/tts", json={"text": "x" * 1500, "voice": "default"}, timeout=30)
    check("Oversized text is handled (not 500)", r.status_code != 500)
except Exception as e:
    check("Oversized text handling", False, str(e))

# Summary
print(f"\n{'='*40}")
print(f"  {PASS} passed  |  {FAIL} failed")
print(f"{'='*40}\n")
sys.exit(0 if FAIL == 0 else 1)
