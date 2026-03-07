# Shared Task Registry

Last updated: 2026-03-07

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
| P2-003 | Add AI response loop (transcript -> API -> TTS) | High | Claude | todo | Milestone 3 |
| P2-004 | Add always-on VAD recording | Medium | Gemini | todo | Milestone 4 |
| P2-005 | Sabrina-style custom voice clone evaluation | Medium | Antigravity | todo | Stretch goal; privacy/licensing review needed |

## Project 3: Just Juggle Support (Friend Project)

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| P3-001 | Deep-dive architecture + backend takeover assessment | High | Codex | done | Completed on 2026-03-07; see session notes for findings |
| P3-002 | Own backend stabilization for hosted environment | High | CBK-CLAUDE-LNX-CLI | todo | Focus: auth hardening, authorization checks, deploy-safe defaults |
| P3-003 | Set up temporary Cloudflare Tunnel hosting for demo access | High | CBK-CLAUDE-LNX-CLI | todo | Tunnel to app on Linux; HTTPS required for camera/microphone features |
| P3-004 | Add minimum pre-public security hardening pass | High | Claude | todo | Password hashing, session auth, IDOR protections before wider sharing |
| P3-005 | Plan follow-up full security audit after demo window | Medium | Codex | todo | Deeper dependency + endpoint abuse review |

## Shared Docs and Ops

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| SH-001 | Keep architecture spec synchronized with project topology | High | Codex | in_progress | Update on boundary/topology change |
| SH-002 | Keep handover and debrief concise and current | High | Codex | in_progress | Update every handoff/session |
| SH-003 | Maintain GitHub branch/merge integrity and release hygiene | High | Codex | in_progress | Final gate before merge to `main` |
