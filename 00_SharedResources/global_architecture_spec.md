# 🌐 Global Architecture Spec: The "Jog & Hack" Initiative

> **Status:** Active (Hackathon)  
> **Core Constraint:** 100% Mobile Voice-first "Vibe Coding" while running three marathons.  
> **Last Updated:** 2026-03-06

This is the overarching Multi-Project Management Spec. It defines the experimental architecture, communication protocols, and the active portfolio of projects.

---

## 🏗️ The Multi-Model Orchestration Framework (Hardware & Topologies)

A critical component of this Hackathon is establishing a truly conversational, zero-latency pipeline for voice coding. This is accomplished via a tiered multi-model topology:

### Tier 1: The Orchestrator (Local-First)
- **Host:** Apple Silicon Mac `[Primary Device]`.
- **Model:** Small parameter routing models (e.g., Llama 3 8B, Qwen 1.5 7B) running locally via Ollama.
- **Responsibility:** Instant back-and-forth speech (~500ms latency), basic query parsing, and determining if a request needs to be routed to higher tiers.

### Tier 2: The Rapid APIs
- **Host:** Cloud API.
- **Model:** High-speed, massive-context reasoning models (Gemini Flash, Claude Sonnet).
- **Responsibility:** The workhorse for the majority of coding conversation. Provides deep context understanding at high speed.

### Tier 3: The Heavy Lifters
- **Host:** Cloud API / Enterprise Compute.
- **Model:** Bleeding-edge agents (Claude 3.5 Opus) / Nvidia GX10 Superchip cluster ("GX10 superchip").
- **Responsibility:** Massive architectural reviews, raw capability coding tasks, and final sanity checks. Invoked manually (e.g., "Ask Opus to review this") or intelligently scaled by Tier 1.

---

## 🚀 Active Project Portfolio

Every project within this workspace maintains its own individual `spec.md` file. This document simply orchestrates the portfolio.

| Dir | Project Name | Description | Status |
|---|---|---|---|
| `Project1_MissionControl` | **AI Mission Control** | Chrome extension for tracking AI usage tokens across Claude/ChatGPT/Kimi using a Cyber-Luxury visual aesthetic. | **In Progress** |
| `Project2_JogAndHack` | **Jog & Hack Voice UI** | The core two-way voice-to-text platform using local Whisper models, AppleScript injection, and Multi-Model VAD pipelines. | **In Progress** |
| `Project3_TBD` | **[Placeholder]** | TBD while marathon pacing. | Ideation |
| `Project4_TBD` | **[Placeholder]** | TBD while marathon pacing. | Ideation |

---

## 🏃‍♂️ Communication Protocols (The "Vibe Coding" Principle)

1. **AI Output MUST be spoken**: `say "message"` is the required prefix for all system feedback. Reading text on a screen while running a marathon is impossible; therefore the AI must summarize its actions out loud.
2. **Autonomous Tooling**: The AI agent is expected to be highly proactive, handling all file creation, terminal execution, GUI interactions (via AppleScript), and Git workflows entirely out of sight.
3. **Escalation**: If a problem is beyond Tier 1/2's capabilities, wait until the user pauses pacing to request Tier 3 intervention.
