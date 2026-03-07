#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
P4_DIR="$ROOT_DIR/Project4-Unwise-Probbably/Sites"
PYTHON_BIN="${PYTHON_BIN:-/Users/cbk/.pyenv/versions/3.13.12/bin/python3}"

FAIL=0

log() {
  printf '%s\n' "$*"
}

pass() {
  log "PASS: $*"
}

fail() {
  log "FAIL: $*"
  FAIL=1
}

check_http() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$code" == "200" ]]; then
    pass "$name -> $url ($code)"
  else
    fail "$name -> $url ($code)"
  fi
}

log "=== Recovery Gate ==="
date

log ""
log "[1] Local service health"
check_http "swarm-command" "http://127.0.0.1:4000/"
check_http "freywill" "http://127.0.0.1:4001/"
check_http "compute-rental" "http://127.0.0.1:4002/"
check_http "auto-miner" "http://127.0.0.1:4003/"
check_http "hackathon-hosting" "http://127.0.0.1:4004/"
check_http "drop-host" "http://127.0.0.1:4005/"
check_http "x402-shared" "http://127.0.0.1:4006/"
check_http "linktree" "http://127.0.0.1:4007/"
check_http "drop-sites-api" "http://127.0.0.1:4005/api/sites"

log ""
log "[2] Quick log scan"
if rg -n "Traceback|Exception|ERROR" "$P4_DIR"/*/output.log >/tmp/recovery_gate_errors.txt 2>/dev/null; then
  fail "Errors found in service logs (see /tmp/recovery_gate_errors.txt)"
else
  pass "No critical error patterns in output logs"
fi

log ""
log "[3] Drop-host tests"
if "$PYTHON_BIN" -m pytest "$P4_DIR/drop-host/test_app.py" -q; then
  pass "drop-host pytest suite"
else
  fail "drop-host pytest suite"
fi

log ""
log "[4] Memory snapshot (top RSS)"
ps aux | sort -nrk 4 | head -n 8 || true

log ""
if [[ "$FAIL" -eq 0 ]]; then
  log "GATE RESULT: PASS"
else
  log "GATE RESULT: FAIL"
  exit 1
fi
