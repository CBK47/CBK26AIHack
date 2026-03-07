# Global Architecture Spec: CBK26AIHack

Status: Active
Last updated: 2026-03-06

This document defines the shared system topology across all projects in this repository.

## 1. Portfolio Topology

| Directory | Project | Purpose | Status |
|---|---|---|---|
| `Project1_MissionControl` | AI Mission Control | Browser extension for AI usage telemetry and dashboard UX | In progress |
| `Project2_JogAndHack` | Jog and Hack Voice UI | Voice-first interaction loop for coding while mobile | In progress |
| `Project3_JugglesJules` | Just Juggle Support | Friend support project: backend and hosting enablement | In progress |
| `Project4-Unwise-Probbably` | FREYWILL | AI services marketplace with x402 + local inference | In progress |

## 2. Model Orchestration Topology

| Tier | Role | Typical models | Runtime |
|---|---|---|---|
| Tier 1 | Low-latency orchestrator | Small local models | Local (Mac/GX10 via Ollama) |
| Tier 2 | Fast coding/reasoning worker | Claude Sonnet / Gemini Flash class | Cloud API |
| Tier 3 | Deep review and complex architecture | Opus class / large open-weight coders | Cloud API or high-end local compute |

## 2.1 Agent Role Map

| Agent | Primary role | Secondary role | Guardrails |
|---|---|---|---|
| Codex | Mission Control and GitHub system integrity | Cross-project planning and merge hygiene | Owns task routing, branch sanity, commit quality, and shared doc consistency |
| Claude | Architecture and code review | Complex refactors and reasoning-heavy implementation | Used for deep design decisions and risk checks before major merges |
| Gemini | High-throughput implementation | Large-context synthesis and rapid first drafts | Used for broad implementation bursts, then reviewed before merge |
| Kimi | Fast utility coding and research summaries | Alternate implementation path for parallel runs | Best for focused sub-tasks with tight scopes |
| Antigravity | Voice pipeline specialist for Project 2 | Runtime integration and environment validation | Owns speech loop milestones and local voice workflow reliability |

Routing rule: assign one owner per task in `task_registry.md`; Codex validates outputs before merge to `main`.

Runtime codename source of truth: `00_SharedResources/runtime_registry.md`.
Execution method source of truth: `00_SharedResources/project_methodology.md`.

## 3. Shared Documentation Contract

| Document | Canonical purpose |
|---|---|
| `global_architecture_spec.md` | Portfolio boundaries, topology, and cross-project operating model |
| `project_methodology.md` | Hackathon execution policy and decision thresholds |
| `runtime_registry.md` | Canonical codename map for model/location/tool deployments |
| `task_registry.md` | Active tasks and ownership across all projects |
| `handover.md` | Transition packet for the next agent/model/human |
| `debrief.md` | Session summary and decisions log |

Rule: architecture changes go here first, then project specs, then task updates.

## 4. Source-of-Truth Rules

1. Project-specific implementation details live in each project's `spec.md` and source files.
2. Cross-project changes must be reflected in this file and `task_registry.md`.
3. Volatile runtime details (ports, one-off commands, temporary host state) belong in handover/debrief, not in architecture spec.

## 5. Network & Port Map

Port assignments are canonical in `00_SharedResources/port_registry.md`. Summary:

| Range | Owner | Key ports |
|---|---|---|
| 3xxx | Project 3 — JugglesJules | 3001 prod, 3002 Vite dev |
| 4xxx | Project 4 — FREYWILL | 4001 Flask API |
| 5xxx | Project 2 — Jog & Hack | 5001 VTT server (running) |
| 8xxx | Hackathon guest hosting | 8001–8005 guest slots |
| 5000, 7000 | macOS AirPlay | **blocked — do not use** |

### Tunnel Strategy

Each project or guest slot gets its own `cloudflared` quick-tunnel when demo access is needed.
Stable named tunnels (requires CF account) for anything needing a persistent URL.
All active tunnel URLs tracked in `port_registry.md` → Active Tunnels table.

### External Hosting Intent

During the hackathon, the Mac Mini will offer shared hosting (8xxx ports) for other teams.
Each guest app gets: a port slot + a cloudflare tunnel URL.
Managed manually via `port_registry.md`. No reverse proxy currently — one tunnel per port.

## 6. Current Architectural Notes

- All four projects active and share one repository.
- Shared planning and transition docs live under `00_SharedResources/`.
- Port assignments canonical in `00_SharedResources/port_registry.md`.
- Current execution queue tracked in `00_SharedResources/task_registry.md`.
- Project 1 is a Chrome extension — no server port.
- Project 3 (JugglesJules) requires PostgreSQL (`DATABASE_URL`) and `SESSION_SECRET` env vars to start.
- Project 4 (FREYWILL) runs on GX10 inference via Ollama at `192.168.0.28:11434`.
