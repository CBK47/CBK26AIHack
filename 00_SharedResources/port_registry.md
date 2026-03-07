# Port Registry — CBK26AIHack

Last updated: 2026-03-07

Single source of truth for all port assignments.
**Claim a port here before starting a service. Do not guess.**

---

## Mac System Ports — DO NOT USE

| Port | Owner | Notes |
|---|---|---|
| 5000 | AirPlay (ControlCenter) | macOS grabs at boot |
| 7000 | AirPlay (ControlCenter) | macOS grabs at boot |
| 24800 | Synergy client | KB/mouse sharing |
| 24802–24803 | Synergy server | KB/mouse sharing |

---

## Project 1 — Mission Control (Chrome Extension)

| Port | Service | Env | Status | Tunnel |
|---|---|---|---|---|
| — | Chrome extension (no server) | — | Loaded in Chrome | — |

---

## Project 2 — Jog & Hack (Voice UI) — 5xxx range

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 5001 | VTT voice-to-text server (`server.py`) | `python server.py` | **Running** | None |
| 5002 | Reserved (P2 expansion) | — | — | — |

---

## Project 3 — JugglesJules (Web App) — 3xxx range

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 3001 | Express app (prod) | `PORT=3001 npm start` | Not started | — |
| 3002 | Vite dev server | `PORT=3002 npm run dev` | Not started | — |

> DB required: set `DATABASE_URL` before starting.
> Set `SESSION_SECRET` for production.

---

## Project 4 — FREYWILL (AI Marketplace) — 4xxx range

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 4001 | Flask API (core) | `python app.py` | Not started | — |
| 4002 | Reserved (FREYWILL expansion) | — | — | — |

---

## Hackathon Guest Hosting — 8xxx range

Slots for other teams' apps during the event.

| Port | Guest / App | Status | Tunnel URL |
|---|---|---|---|
| 8001 | (open) | Available | — |
| 8002 | (open) | Available | — |
| 8003 | (open) | Available | — |
| 8004 | (open) | Available | — |
| 8005 | (open) | Available | — |

---

## GX10 Linux Box (remote — 192.168.0.28 / Tailscale)

| Port | Service | Notes |
|---|---|---|
| 11434 | Ollama inference | llama3.2:3b, qwen2.5-coder:32b, deepseek-coder-v2:16b |
| 5000 | VTT server (GX10 mirror) | Linux instance of P2 voice server |

---

## Active Tunnels

| Local port | Tunnel URL | Project | Started | PID |
|---|---|---|---|---|
| — | — | — | — | — |

> Update this table whenever `cloudflare-tunnel.sh` is started.
> Kill command: `kill <PID>` or `pkill cloudflared`
