# Port Registry — CBK26AIHack

Last updated: 2026-03-07 (network audit at ~04:15 UTC)

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

## Project 2 — Jog & Hack (Voice UI) — 2xxx range

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 2001 | VTT voice-to-text server (`server.py`) | `python server.py` | Assigned | None |
| 2002 | TTS server (`tts_server.py`) | `python tts_server.py` | Assigned | None |

> Legacy references to `5001/5002` are deprecated; use `2001/2002` for Project 2 going forward.

---

## Project 3 — JugglesJules (Web App) — 3xxx range

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 3001 | Express app (prod) | `PORT=3001 npm start` | Not started | — |
| 3002 | Vite dev server | `PORT=3002 npm run dev` | Not started | — |

> DB required: set `DATABASE_URL` before starting.
> Set `SESSION_SECRET` for production.

---

## Project 4 — FREYWILL (AI Marketplace) — 4000-4014

| Port | Service | Start command | Status | Tunnel |
|---|---|---|---|---|
| 4000 | Swarm Command dashboard | `python app.py` or service-specific runner | Ready to test | Pending |
| 4001 | FREYWILL AI | service runner | Active build | Pending |
| 4002 | Compute Rental | service runner | Active build | Pending |
| 4003 | Auto-Miner | service runner | Active build | Pending |
| 4004 | Hackathon Hosting | service runner | Active build | Pending |
| 4005 | Drop and Host | service runner | In progress | Pending |
| 4006 | x402 Payments | service runner | Mock mode | Pending |
| 4007 | Linktree | service runner | Active build | Pending |
| 4008-4014 | Reserved slots | — | Reserved | — |

## Project 5 — Hacker Webhosting — 5000-5019

| Port | Service | Status | Tunnel |
|---|---|---|---|
| 5000 | Gateway/Directory | Planned | Pending |
| 5001-5019 | Guest slots (19) | Planned | Pending |

Note: macOS uses `5000` for AirPlay. If Project 5 runs on Mac, remap this range or run Project 5 on Linux host.

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

## GX10 Linux Box (remote — 192.168.0.28 / LAN)

| Port | Service | Notes |
|---|---|---|
| 22 | SSH | LAN-exposed (expected) |
| 7860 | Image generation Flask API (Werkzeug) | LAN-exposed, `/health` returns model path/status |
| 24802 | Express service | LAN-exposed, returns Express 404 on `/` and `/health` |
| 5000 | Legacy VTT server instance | Localhost only (`127.0.0.1`) |
| 8080 | Open WebUI | Localhost only (`127.0.0.1`) |
| 11000 | DGX dashboard | Localhost only (`127.0.0.1`) |
| 11434 | Ollama inference | Localhost/internal bridge only (`127.0.0.1`, `172.20.0.1`) |

### Audit Snapshot (2026-03-07 ~04:15 UTC)

- LAN-open from Mac checks: `22`, `7860`, `24802`.
- LAN-closed from Mac checks: `5000`, `8080`, `11000`, `11434`, `24803`.
- `ufw`/`firewalld` not installed on GX10; host firewall policy requires explicit nftables/iptables review with root access.

### Immediate Hardening Notes

1. Verify and justify listeners on `7860` and `24802`.
2. Bind non-SSH services to localhost unless intentionally public.
3. Prefer Cloudflare Tunnel for external/demo access instead of direct LAN exposure.

---

## Active Tunnels

| Local port | Tunnel URL | Project | Started | PID |
|---|---|---|---|---|
| — | — | — | — | — |

> Update this table whenever `cloudflare-tunnel.sh` is started.
> Kill command: `kill <PID>` or `pkill cloudflared`
