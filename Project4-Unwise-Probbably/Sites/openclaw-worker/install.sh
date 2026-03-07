#!/bin/bash
# OPENCLAW Worker Installer
# Run: curl -sSL ... | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🐾 OPENCLAW Worker Installer"
echo "   Passive income from idle hardware"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    echo -e "${RED}Error: Cannot detect OS${NC}"
    exit 1
fi

echo "📦 Installing on: $OS"
echo ""

# Install dependencies
echo "Installing dependencies..."
if command -v apt-get &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq python3 python3-pip xprintidle 2>/dev/null || {
        echo "Note: xprintidle not available, using fallback idle detection"
    }
else
    echo -e "${YELLOW}Warning: apt-get not found, skipping package install${NC}"
fi

# Create directories
echo "Creating directories..."
mkdir -p /opt/openclaw/{bin,config,data,logs}
mkdir -p /var/log/openclaw
mkdir -p /etc/openclaw

# Download worker script
REPO_URL="https://raw.githubusercontent.com/ejcbk47-Debug/-PROJECT-4-FREYWILL-AI-Services-Marketplace/main"

echo "Downloading worker..."
curl -sSL "$REPO_URL/openclaw-worker/openclaw-worker.py" -o /opt/openclaw/bin/openclaw-worker.py
chmod +x /opt/openclaw/bin/openclaw-worker.py

# Download config script
curl -sSL "$REPO_URL/openclaw-worker/scripts/openclaw-config" -o /usr/local/bin/openclaw-config
chmod +x /usr/local/bin/openclaw-config

# Create default config
cat > /opt/openclaw/config/config.json << 'EOF'
{
  "wallet_address": "",
  "idle_threshold_minutes": 5,
  "max_cpu_percent": 80,
  "mining_enabled": true,
  "ai_tasks_enabled": true,
  "platform_fee_percent": 1,
  "swarm_endpoint": "https://land-comfortable-director-arabic.trycloudflare.com",
  "coins": ["monero", "verus"],
  "auto_switch": true
}
EOF

# Install systemd service
echo "Installing systemd service..."
cat > /etc/systemd/system/openclaw.service << 'EOF'
[Unit]
Description=OPENCLAW Worker - Passive Income from Idle Hardware
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openclaw
ExecStart=/usr/bin/python3 /opt/openclaw/bin/openclaw-worker.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/openclaw/service.log
StandardError=append:/var/log/openclaw/error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable
systemctl daemon-reload
systemctl enable openclaw

echo ""
echo -e "${GREEN}✅ OPENCLAW installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "   1. Set your wallet: sudo openclaw-config --wallet 0xYOUR_ADDRESS"
echo "   2. Start worker:    sudo systemctl start openclaw"
echo "   3. Check status:    sudo systemctl status openclaw"
echo "   4. View logs:       sudo tail -f /var/log/openclaw/service.log"
echo ""
echo "The worker will:"
echo "   • Monitor idle time"
echo "   • Mine when you're AFK for 5+ minutes"
echo "   • Auto-pause when you return"
echo "   • Send earnings to your wallet"
echo "   • Take 1% platform fee"
echo ""
echo "Estimated earnings:"
echo "   • Laptop:      $5-15/month"
echo "   • Gaming PC:   $15-45/month"
echo "   • Workstation: $60-120/month"
echo ""
