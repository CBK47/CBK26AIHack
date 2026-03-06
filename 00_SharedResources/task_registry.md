# Shared Task Registry

Last updated: 2026-03-06

Use this file as the actionable multi-agent backlog.

## Status Key

- `todo`: not started
- `in_progress`: actively being worked
- `blocked`: waiting on dependency/decision
- `done`: completed

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

## Shared Docs and Ops

| ID | Task | Priority | Owner | Status | Notes |
|---|---|---|---|---|---|
| SH-001 | Keep architecture spec synchronized with project topology | High | Codex | in_progress | Update on boundary/topology change |
| SH-002 | Keep handover and debrief concise and current | High | Codex | in_progress | Update every handoff/session |
| SH-003 | Maintain GitHub branch/merge integrity and release hygiene | High | Codex | in_progress | Final gate before merge to `main` |
