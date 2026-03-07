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

### Top priority for Mac Claude (incoming)
- **Get voice loop working end-to-end on Mac** — run the VTT server locally on Mac, point Ollama at GX10 (`http://192.168.0.28:11434`), test full speak→transcribe→AI→TTS cycle in Mac browser.
- The browser mic restriction means HTTP only works on localhost — running server on Mac avoids needing HTTPS/certs.

### P2 status
- P2-003 (AI loop) ✅ done — code is merged to main.
- P2-001 / P2-002 (TTS playback, spoken confirmation) — can be validated once Mac server is running.
- P2-005 (Sabrina XTTS clone) — still blocked on dep install on GX10; browser speechSynthesis is the fallback TTS for now.

### P1 status
- Unchanged. P1-001, P1-002, P1-003 still todo.

## 3. Open Work Pointers

- See `00_SharedResources/task_registry.md` for task-level backlog and ownership.
- Project 2 implementation: `Project2_JogAndHack/voice-to-text/`
- Project 1 implementation: `Project1_MissionControl/`

## 4. Environment Notes

### GX10 (Linux, 192.168.0.28)
- Ollama running on `localhost:11434` with models: `llama3.2:3b`, `deepseek-coder-v2:16b`, `qwen2.5-coder:32b`
- VTT server running on `localhost:5000` (127.0.0.1 only — not LAN-accessible)
- Python venv for VTT: `/home/cbk/vtt_env` — has faster-whisper, flask, waitress
- Whisper model cached at: `Project2_JogAndHack/voice-to-text/.models/` (~974MB, turbo model)
- ctranslate2 on GX10 is aarch64 CPU-only build (no CUDA wheel available for arm64)
- TTS server (`tts_server.py`) exists but NOT running — XTTS v2 deps still installing
- Current VTT config: model=turbo, device=cpu, ai_loop=true, ollama_model=llama3.2:3b

### Mac (incoming agent)
- VTT server not yet set up on Mac — **this is the next task**
- Mac has: Whisper VTT code (this repo), AppleScript automation, `say` command for TTS
- Set `ollama_url` in config.json to `http://192.168.0.28:11434` to use GX10 Ollama
- Mac browser can use mic on localhost — no HTTPS needed
- `say` command works on Mac for TTS — could wire as alternative to XTTS

### Key config to set on Mac (`voice-to-text/config.json`):
```json
{
  "model": "base",
  "device": "cpu",
  "compute_type": "int8",
  "port": 5001,
  "ai_loop": true,
  "ollama_url": "http://192.168.0.28:11434",
  "ollama_model": "llama3.2:3b",
  "tts_url": "http://localhost:5002",
  "tts_voice": "default"
}
```
- Use `base` model first (smaller, faster to download). Port 5001 to avoid conflicts.
- For TTS on Mac: `say` command works natively. Could add a `/tts` shim using `say` as a quick win.

## 5. Handover Checklist (Required)

Before ending a session, update:
1. `task_registry.md` statuses and owners.
2. One new entry in `debrief.md`.
3. This file's priority snapshot if priorities changed.
