# Global Architecture Spec: CBK26AIHack

Status: Active
Last updated: 2026-03-06

This document defines the shared system topology across all projects in this repository.

## 1. Portfolio Topology

| Directory | Project | Purpose | Status |
|---|---|---|---|
| `Project1_MissionControl` | AI Mission Control | Browser extension for AI usage telemetry and dashboard UX | In progress |
| `Project2_JogAndHack` | Jog and Hack Voice UI | Voice-first interaction loop for coding while mobile | In progress |
| `Project3_TBD` | TBD | Reserved slot for future project | Ideation |
| `Project4_TBD` | TBD | Reserved slot for future project | Ideation |

## 2. Model Orchestration Topology

| Tier | Role | Typical models | Runtime |
|---|---|---|---|
| Tier 1 | Low-latency orchestrator | Small local models | Local (Mac/GX10 via Ollama) |
| Tier 2 | Fast coding/reasoning worker | Claude Sonnet / Gemini Flash class | Cloud API |
| Tier 3 | Deep review and complex architecture | Opus class / large open-weight coders | Cloud API or high-end local compute |

## 3. Shared Documentation Contract

| Document | Canonical purpose |
|---|---|
| `global_architecture_spec.md` | Portfolio boundaries, topology, and cross-project operating model |
| `task_registry.md` | Active tasks and ownership across all projects |
| `handover.md` | Transition packet for the next agent/model/human |
| `debrief.md` | Session summary and decisions log |

Rule: architecture changes go here first, then project specs, then task updates.

## 4. Source-of-Truth Rules

1. Project-specific implementation details live in each project's `spec.md` and source files.
2. Cross-project changes must be reflected in this file and `task_registry.md`.
3. Volatile runtime details (ports, one-off commands, temporary host state) belong in handover/debrief, not in architecture spec.

## 5. Current Architectural Notes

- Project 1 and Project 2 are active and share the same repository.
- Shared planning and transition docs live under `00_SharedResources/`.
- Current execution queue is tracked in `00_SharedResources/task_registry.md`.
