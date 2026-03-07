# OPENCLAW Worker

Passive income from idle hardware. Install, run, earn.

## Quick Install (Ubuntu/Debian)

```bash
curl -sSL https://raw.githubusercontent.com/ejcbk47-Debug/-PROJECT-4-FREYWILL-AI-Services-Marketplace/main/openclaw-worker/install.sh | bash
```

## What It Does

- Monitors system idle time
- When idle >5 mins: starts mining (XMR/Verus) + AI task processing
- Earns micro-rewards to your wallet
- 1% platform fee supports swarm infrastructure
- Auto-pauses when you return

## Requirements

- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum
- Internet connection
- Wallet address (Base network)

## Earnings Estimate

| Hardware | Daily | Monthly |
|----------|-------|---------|
| Basic Laptop | $0.15-0.50 | $5-15 |
| Gaming PC | $0.50-1.50 | $15-45 |
| Workstation | $2-4 | $60-120 |

## Uninstall

```bash
sudo systemctl stop openclaw
sudo systemctl disable openclaw
sudo rm -rf /opt/openclaw
```
