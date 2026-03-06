# Runtime Registry: Codenames, Locations, and Tool Stacks

Last updated: 2026-03-06

Purpose: provide one canonical naming system for model+location+tool combinations.

## Naming Pattern

`<TEAM>-<PLATFORM>-<LOCATION>-<ROLE>`

Examples:
- `CBK-CLAUDE-LNX-CLI`
- `CBK-CODEX-MAC-MC`

## Active Runtime Matrix

| Codename | Model/App | Location | Interface | Primary role | Tools profile |
|---|---|---|---|---|---|
| `CBK-CODEX-MAC-MC` | Codex app | Mac | Desktop app | Mission Control and GitHub integrity gate | Repo edit, terminal execution, integration checks |
| `CBK-CLAUDE-MAC-DESK` | Claude desktop/app | Mac | Desktop app | Architecture review and deep reasoning support | Spec analysis, design review, refactor guidance |
| `CBK-CLAUDE-LNX-CLI` | Claude CLI | Linux box | Terminal/CLI | Autonomous build and implementation runs | Scripted code edits, test loops, batch execution |
| `CBK-GPT-MAC-RESEARCH` | ChatGPT | Mac | Browser/app | Quick research and rapid external lookup | Fast investigation, summary extraction |
| `CBK-ANTIGRAV-HYBRID-VOICE` | Antigravity (multi-model) | Mac + Linux | Mixed | Project 2 voice-loop specialist | STT/TTS integration, runtime voice pipeline validation |

## Linux Local Model Roles (Ollama / Local Inference)

| Codename | Model | Location | Assigned function |
|---|---|---|---|
| `CBK-LOCAL-LNX-ORCH` | `llama3.2:3b` | Linux | Low-latency conversational orchestrator and routing |
| `CBK-LOCAL-LNX-CODER` | `qwen2.5-coder:32b` | Linux | Heavy implementation and code-generation worker |
| `CBK-LOCAL-LNX-DEBUG` | `deepseek-coder-v2:16b` | Linux | Debugging and fault isolation specialist |

## Operating Rules

1. Use codename in handovers and task assignment notes.
2. One task should have one owner codename at a time.
3. `CBK-CODEX-MAC-MC` is final integration gate before merge.
