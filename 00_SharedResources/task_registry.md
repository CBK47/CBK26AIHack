# Shared Task Registry

Last updated: 2026-03-07 (CBK-CLAUDE-LNX-CLI — P2-003 done, handover to Mac)

Use this file as the actionable multi-agent backlog.

## Status Key

- `todo`: not started
- `in_progress`: actively being worked
- `on_hold`: paused intentionally; include short reason
- `blocked`: waiting on dependency/decision
- `done`: completed

## Execution Rule

Update task status before doing work:
1. Set to `in_progress` when starting.
2. Set to `on_hold` with reason if paused/abandoned.
3. Set to `done` when complete.

## Project 1: Mission Control

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| P1-001 | Replace heuristic token limits with real provider limits | High | Gemini | todo | Coordinate with `api_research.md` |
| P1-002 | Replace random heatmap with real history snapshots | High | Kimi | todo | Requires storage schema update |
| P1-003 | Wire feature toggles from UI to actual behavior | Medium | Claude | todo | History/GitHub toggles currently stubbed |

## Project 2: Jog and Hack

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| P2-001 | Verify stable TTS playback while Whisper idle | High | Antigravity | todo | Milestone 1 |
| P2-002 | Implement spoken confirmation after transcription | High | Antigravity | todo | Milestone 2 |
| P2-003 | Add AI response loop (transcript -> API -> TTS) | High | Claude | done | Wired Whisper -> Ollama llama3.2:3b -> TTS. server.py: ai_loop config flag, /ai_chat endpoint, call_ollama + call_tts helpers. Frontend: AI response panel with XTTS audio (base64) + browser speechSynthesis fallback. Settings: AI Loop toggle + model picker. |
| P2-004 | Add always-on VAD recording | Medium | Gemini | todo | Milestone 4 |
| P2-005 | Sabrina-style custom voice clone evaluation | Medium | Antigravity | in_progress | GX10: clone_sabrina.sh + tts_server.py + mac_tts_patch.js written & pushed. XTTS v2 deps installing (Python 3.11 venv). Blocked on final dep install (transformers/umap-learn). |

## Project 3: Just Juggle Support (Friend Project)

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| P3-001 | Deep-dive architecture + backend takeover assessment | High | Codex | done | Completed on 2026-03-07; see session notes for findings |
| P3-002 | Own backend stabilization for hosted environment | High | CBK-CLAUDE-LNX-CLI | done | Session middleware (express-session + memorystore), SESSION_SECRET env guard, requireAuth on all private routes, PATCH /api/user/:id IDOR fixed, training-goal/session/forum ownership checks. Set SESSION_SECRET before deploy. |
| P3-003 | Set up temporary Cloudflare Tunnel hosting for demo access | High | CBK-CLAUDE-LNX-CLI | done | cloudflare-tunnel.sh in project root. Run alongside `npm start`. Auto-installs cloudflared on Mac/Ubuntu/RHEL. |
| P3-004 | Add minimum pre-public security hardening pass | High | Claude | done | scrypt password hashing (Node crypto, no new deps). timingSafeEqual comparison. Register hashes; login verifies. Existing plaintext-password accounts need re-registration or manual re-hash. |
| P3-005 | Plan follow-up full security audit after demo window | Medium | Codex | todo | Deeper dependency + endpoint abuse review |

## Shared Docs and Ops

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| SH-001 | Keep architecture spec synchronized with project topology | High | Codex | in_progress | Update on boundary/topology change |
| SH-002 | Keep handover and debrief concise and current | High | Codex | in_progress | Update every handoff/session |
| SH-003 | Maintain GitHub branch/merge integrity and release hygiene | High | Codex | in_progress | Final gate before merge to `main` |
| SH-004 | Maintain live server/port inventory across environments | High | CBK-PORTWATCH-LNX-NET | in_progress | 2026-03-07 audit captured GX10 exposed ports: 22, 7860, 24802; see `port_registry.md` |
| SH-005 | Run recurring mini security checks on active services | High | CBK-SENTINEL-LNX-SEC | todo | Prioritize exposed apps, auth routes, dependency risk, and config drift |
| SH-006 | Run post-crash controlled rollout with explicit gate checks | High | Codex | done | Completed 2026-03-07 with `recovery_gate.sh` + runbook and repeated PASS gates |
| SH-007 | Validate Project5 complex-site ingestion into Drop & Host | High | Codex | done | Completed 2026-03-07: `p5-filler-demo`, `p5-kaleo-demo`, `p5-photographer-demo` imported and externally reachable |
