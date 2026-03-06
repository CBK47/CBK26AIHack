# Agent Roles and Operating Split

Last updated: 2026-03-06

This file defines role ownership across available agents/models.

## Core Role Assignment

| Agent | Role |
|---|---|
| Codex | Mission Control, GitHub system integrity, final integration gate |
| Claude | Architecture quality, review depth, complex reasoning tasks |
| Gemini | High-volume implementation and broad-context coding |
| Kimi | Focused utility implementation and lightweight parallel tasks |
| Antigravity | Project 2 voice pipeline execution and runtime workflow reliability |

## Decision Rights

1. Codex owns merge readiness and task routing.
2. Task owner owns implementation details for assigned tickets.
3. Claude is default reviewer for high-risk architectural changes.

## GitHub Workflow Ownership

1. Codex ensures branch hygiene and clean commits.
2. Codex verifies no oversized files or nested repositories are introduced.
3. Codex updates shared docs (`global_architecture_spec.md`, `task_registry.md`, `handover.md`, `debrief.md`) when operating model changes.

## Escalation

1. If task is blocked by missing environment/API access, owner marks `blocked` in `task_registry.md`.
2. Codex re-routes blocked items to alternate agent or decomposes into smaller tasks.
