# Handover: Model-to-Model Transition Packet

Created: 2026-03-06
Last updated: 2026-03-06

Purpose: hand over active context when switching between models/agents/humans.

## 1. Read Order for Incoming Agent

1. `00_SharedResources/global_architecture_spec.md`
2. `00_SharedResources/project_methodology.md`
3. `00_SharedResources/runtime_registry.md`
4. `00_SharedResources/task_registry.md`
5. Relevant project `spec.md`
6. This handover file
7. Latest debrief entry in `00_SharedResources/debrief.md`

## 2. Current Priority Snapshot

### P1
- Project 2: establish reliable full voice loop (speech in, AI response, speech out).
- Project 1: continue telemetry accuracy and data-source hardening.

### P2
- Improve automation strategy for parallel agent execution where safe.
- Keep shared docs synchronized with real code state.

## 3. Open Work Pointers

- See `00_SharedResources/task_registry.md` for task-level backlog and ownership.
- Project 1 implementation scope: `Project1_MissionControl/spec.md`.
- Project 2 implementation scope: `Project2_JogAndHack/spec.md`.

## 4. Environment Notes

- This repo uses one top-level git history.
- `Project2_JogAndHack/voice-to-text/` is part of this repo (nested git metadata removed).
- Large local model artifacts under `.models/` are ignored and must stay untracked.

## 5. Handover Checklist (Required)

Before ending a session, update:
1. `task_registry.md` statuses and owners.
2. One new entry in `debrief.md`.
3. This file's priority snapshot if priorities changed.
