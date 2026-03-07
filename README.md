# CBK26AIHack Workspace Glossary

Last updated: 2026-03-06

This top-level README is the workspace index. It explains what each folder is for and which document to read for each type of work.

## Folder Map

| Path | What it is | When to use it |
|---|---|---|
| `00_SharedResources/` | Cross-project docs used by all agents/models | Start here before planning or handoff |
| `Project1_MissionControl/` | Chrome extension for AI usage telemetry and dashboard UX | Work on extension, UI, tracking, provider integration |
| `Project2_JogAndHack/` | Voice-first workflow stack (Whisper VTT, automation, voice loop) | Work on speech-to-text, text-to-speech, local orchestration |
| `Project3_JugglesJules/` | Just Juggle support project | Backend/hosting support for friend project |
| `Project4-Unwise-Probbably/` | FREYWILL marketplace concept | Agent-built AI services marketplace workstream |
| `.agent/`, `.claude/` | Tooling/agent local config | Usually do not edit unless needed |

## Shared Resources Glossary

| File | Role | Update cadence |
|---|---|---|
| `00_SharedResources/global_architecture_spec.md` | Source of truth for portfolio topology and model orchestration | Update when architecture, project boundaries, or topology changes |
| `00_SharedResources/task_registry.md` | Actionable multi-agent task list split by project and priority | Update whenever tasks are added, reassigned, started, or completed |
| `00_SharedResources/handover.md` | Model-to-model or human-to-model transition state | Update at every meaningful handoff |
| `00_SharedResources/debrief.md` | Session outcomes, decisions, and follow-ups | Append after each focused work session |
| `00_SharedResources/agent_roles.md` | Agent role ownership and GitHub control model | Update when role split or control rules change |
| `00_SharedResources/runtime_registry.md` | Codename registry for model+location+tool combinations | Update when runtimes or locations change |
| `00_SharedResources/project_methodology.md` | Hackathon execution method (`JFDI-GSD`) and operating rules | Update when execution policy changes |
| `00_SharedResources/autonomous_agents_strategy.md` | Strategy notes for running multiple autonomous agents in parallel | Update when automation strategy changes |
| `00_SharedResources/user_guide.md` | End-user setup/test instructions for Project 1 extension | Update when installation/run steps change |

## Project Entry Points

### Project 1: Mission Control
- Spec: `Project1_MissionControl/spec.md`
- Code root: `Project1_MissionControl/extension/`
- API notes: `Project1_MissionControl/api_research.md`
- Prior handoff context: `Project1_MissionControl/opus_handoff.md`

### Project 2: Jog And Hack
- Spec: `Project2_JogAndHack/spec.md`
- Code root: `Project2_JogAndHack/voice-to-text/`
- Security tool: `Project2_JogAndHack/security_scan.py`

## Working Rules (Short Version)

1. Treat `global_architecture_spec.md` as the system map.
2. Treat `task_registry.md` as the execution queue.
3. Use `handover.md` only for transition context.
4. Use `debrief.md` only for session outcomes.
5. Keep project-level implementation details in each project's own folder/spec.

## Current Workspace Status

- Repo structure is split into shared resources plus four project slots.
- Project 1 and Project 2 are active.
- Project 3 and Project 4 are now active named workstreams.
- `Project2_JogAndHack/voice-to-text/` is now tracked directly in this repo (not as nested git).
