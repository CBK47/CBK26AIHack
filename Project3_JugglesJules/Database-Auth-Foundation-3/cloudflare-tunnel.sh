#!/usr/bin/env bash
# P3-003: Cloudflare Quick Tunnel for Just Juggle demo
# Gives a public HTTPS URL tunnelled to localhost:5000.
# No Cloudflare account needed. URL is temporary and changes on restart.
#
# Usage:
#   chmod +x cloudflare-tunnel.sh
#   ./cloudflare-tunnel.sh
#
# For a stable named tunnel (requires CF account), see:
#   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

set -e

APP_PORT="${PORT:-3001}"

# Install cloudflared if not present
if ! command -v cloudflared &>/dev/null; then
  echo "[tunnel] cloudflared not found — installing..."
  if [[ "$(uname)" == "Darwin" ]]; then
    brew install cloudflared
  elif command -v apt-get &>/dev/null; then
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
    sudo dpkg -i /tmp/cloudflared.deb
  elif command -v yum &>/dev/null; then
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm -o /tmp/cloudflared.rpm
    sudo rpm -i /tmp/cloudflared.rpm
  else
    echo "[tunnel] ERROR: cannot auto-install cloudflared. Install manually from:"
    echo "  https://github.com/cloudflare/cloudflared/releases"
    exit 1
  fi
fi

echo "[tunnel] Starting quick tunnel → http://localhost:${APP_PORT}"
echo "[tunnel] The public HTTPS URL will appear below in ~5 seconds."
echo "[tunnel] Camera and microphone features require HTTPS — this provides it."
echo ""

cloudflared tunnel --url "http://localhost:${APP_PORT}"
