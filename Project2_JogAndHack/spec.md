# 🎙️ Voice Back-and-Forth Milestones — v1

> **Project:** Project 2 — "Jog & Hack" (Advanced Voice Interface)  
> **Goal:** Fully hands-free, two-way voice conversation with AI while jogging  
> **Created:** 2026-03-06  

---

## Ports

| Port | Service | Range |
|---|---|---|
| 2001 | VTT voice-to-text server (`server.py`) | 2xxx (P2 range) |
| 2002 | TTS server (`tts_server.py`) | 2xxx (P2 range) |

Full port registry: `00_SharedResources/port_registry.md`

---

## Current State

- ✅ Whisper VTT server running locally (assigned port 2001)
- ✅ Click-to-record with browser microphone
- ✅ Auto-clipboard + auto-submit (Cmd+V → Return via AppleScript)
- ✅ Premium waveform visualizer (128 bars, mel-scale, peak-hold)
- ❌ macOS Dictation conflicts with `say` TTS (mutes voice output)
- ❌ No AI response loop (transcription only, no AI reply)
- ❌ No always-on listening (must click/press hotkey)

---

## Milestones

### Milestone 1: TTS Works Alongside Whisper
**Proves:** `say` command plays audio while Whisper VTT is idle (not actively recording)

- **What to do:** Stop using macOS Dictation entirely. Use Whisper VTT for all voice input. Test that `say` plays through Bose headphones between recordings.
- **Why it matters:** If this works, we have a clean channel for AI to talk back to us.
- **Effort:** ~5 min (just a test)
- **Success criteria:** User hears TTS playback between Whisper recordings without any muting.

---

### Milestone 2: Server Speaks Back After Transcribing
**Proves:** Basic "I talk → it talks back" loop works

- **What to do:** After Whisper transcribes your speech, the Python server automatically calls `say` with a spoken confirmation (e.g. "Got it. 42 words transcribed.") or reads back the transcription itself.
- **Why it matters:** Validates the full audio round-trip without any AI — voice in, voice out.
- **Effort:** ~10 min
- **Success criteria:** User speaks → hears spoken confirmation through headphones after transcription completes.

---

### Milestone 3: Connect to AI API (The Real Loop)
**Proves:** Full voice conversation loop — speak → AI thinks → AI speaks back

- **What to do:** 
  - Take the transcribed text from Whisper
  - Send it to an AI API (Claude API / OpenAI API / Gemini API)
  - Receive the AI's text response
  - Feed it to macOS `say` (or a higher-quality TTS engine)
  - Play the response through headphones
- **Why it matters:** This is the core experience — a real hands-free AI conversation.
- **Effort:** ~30 min
- **Dependencies:** API key for at least one AI provider
- **Success criteria:** User speaks a question → hears the AI's spoken answer back.

---

### Milestone 4: Voice Activity Detection (Always-On Listening)
**Proves:** Zero-touch recording — no clicking, no hotkeys

- **What to do:**
  - Implement client-side or server-side VAD (Voice Activity Detection)
  - Auto-start recording when speech is detected
  - Auto-stop recording after a configurable silence threshold (e.g. 1.5s)
  - Add a manual toggle to pause/resume listening entirely
- **Why it matters:** True hands-free for jogging — just start talking.
- **Effort:** ~1 hour
- **Options:** WebRTC VAD, `silero-vad`, or `py-webrtcvad`
- **Success criteria:** User starts speaking → recording begins automatically → stops after silence → transcribes → AI responds.

---

### Milestone 5: Interruption Support (Conversational)
**Proves:** Natural conversation — user can cut off the AI mid-sentence

- **What to do:**
  - Monitor microphone while TTS is playing
  - If user starts speaking, immediately stop TTS playback
  - Begin new recording
  - Send the new input to the AI with context of what was already spoken
- **Why it matters:** Real conversations have interruptions. This makes it feel human.
- **Effort:** ~1 hour
- **Success criteria:** AI is speaking → user says "wait" → AI stops → user speaks new prompt → AI responds to the interruption.

---

## Multi-Model Orchestration Framework (Local-First Design)

To achieve true conversational speed while preserving access to "God-tier" reasoning when needed, the system will use a **Multi-Model Orchestrator**. 

| Tier | Model Class | Execution | Primary Role |
|---|---|---|---|
| **Tier 1: Orchestrator & Conversationalist** | Small, fast local model (e.g. Llama 3 8B, Qwen 1.5 7B) | Local (Ollama) | Real-time back-and-forth speech. Extremely low latency. Handles simple queries directly and determines if a task needs to be farmed out. |
| **Tier 2: Rapid API Workers** | High-speed API models (Gemini Flash, Claude Sonnet) | Cloud API | Fast processing of complex context, code suggestions, or parsing large texts sent from the Orchestrator. |
| **Tier 3: The Heavy Lifters** | Bleeding-edge agents (Claude 3.5 Opus) | Cloud API | Final sanity checks, deep architectural reasoning, and complex hardcore coding tasks. Invoked manually (e.g. "Ask Opus") or automatically by the Tier 1 router. |

**The Workflow:**
1. Whisper transcribes your voice locally.
2. The transcript hits the **Tier 1 Local Model**.
3. If it's a simple query ("What time is it?", "Record a note"), Tier 1 answers immediately (~500ms latency).
4. If it's a bleeding-edge task ("Review this whole codebase"), Tier 1 farms the request out to Opus/Flash, talks back to you to say "I've asked Opus to look into that," and then reads out the Opus summary when it returns.

---

## Hardware Setup & Configuration

*Note: This section is a placeholder to be filled out with specific environment details by someone with deep hardware knowledge.*

Currently deployed environments:
- **Primary Dev Machine:** Apple Silicon Mac (running Whisper VTT, AppleScript automations, and Ollama for the Tier 1 local model).
- **Compute Cluster:** Nvidia GX10 Superchip — Target architecture for running massive open-weight models locally with maximum memory bandwidth.

*(Further details to be dropped here regarding GX10 CUDA setup, inference servers (vLLM/TGI), and tunneling back to the Mac).*

---

## Stretch Goals (Post-v1)

- **Custom Voice (The Sabrina Clone):** Implement high-quality local TTS using XTTS v2 or GPT-SoVITS cloned from Sabrina's voice samples (as per her hackathon invitation).
- **Wake Word:** "Hey Whisper" to activate from deep sleep
- **Conversation Memory:** Persist conversation context across sessions
- **Multi-Model Routing:** Use cheap/fast models for simple queries, powerful models for complex ones
- **Running Stats Integration:** Pull live Strava data and speak pace/distance updates

---

## Notes

- All processing should stay **local-first** where possible (privacy)
- The system must be **marathon-safe** — low battery usage, Bluetooth stable
- Voice should feel **responsive** — target <2s from end-of-speech to start-of-AI-response
