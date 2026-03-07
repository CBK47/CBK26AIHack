# Debrief Log

Purpose: append concise session outcomes. This is not the architecture source of truth.

## Entry Template

- Date:
- Session scope:
- What changed:
- Decisions made:
- Follow-ups:

## 2026-03-07 (CBK-CLAUDE-LNX-CLI — P2-003 AI Loop)

- Session scope: implement P2-003 AI response loop on GX10.
- What changed:
  - `server.py`: added `call_ollama()`, `call_tts()`, `/ai_chat` endpoint, AI loop wired into `/transcribe` response. New config keys: `ai_loop`, `ollama_url`, `ollama_model`, `tts_url`, `tts_voice`, `ai_system_prompt`.
  - `index.html`: AI response panel with thinking animation, speak/stop buttons. AI Loop toggle + model picker in settings.
  - `app.js`: `showAIResponse()`, `speakText()`, `stopAISpeech()`. Plays XTTS WAV if available, falls back to browser `speechSynthesis`.
  - `style.css`: AI response panel + dot animation styles.
  - Fixed `needs_restart` false positive in `/config POST` (was always true because model/device keys always present in payload).
  - Created `/home/cbk/vtt_env` — dedicated Python venv with faster-whisper, flask, waitress.
  - VTT server running on GX10 localhost:5000 with turbo model on CPU, ai_loop enabled.
- Decisions made:
  - ctranslate2 aarch64 wheel has no CUDA support — stuck on CPU for Whisper on GX10 for now.
  - Browser `speechSynthesis` is the TTS fallback until XTTS server is up (P2-005 still blocked).
  - Browser mic requires localhost or HTTPS — running server on Mac is cleaner than adding self-signed certs to GX10.
- Follow-ups (for Mac Claude):
  - Set up VTT server on Mac (see handover.md §4 for exact config).
  - Point `ollama_url` at GX10 (`http://192.168.0.28:11434`).
  - Test full voice loop end-to-end in Mac browser.
  - Consider adding `say`-based TTS shim on Mac as `/tts` endpoint for native voice.

## 2026-03-06 (Docs Sanity Pass)

- Session scope: normalize shared documentation roles and top-level navigation.
- What changed:
  - Rewrote top-level README as a workspace glossary.
  - Clarified architecture spec role as topology-only document.
  - Refactored handover into a transition packet with checklist.
  - Added a shared task registry for multi-agent task splits.
- Decisions made:
  - `global_architecture_spec.md` is canonical for topology.
  - `task_registry.md` is canonical for actionable backlog.
  - `handover.md` and `debrief.md` are operational logs, not long-term architecture docs.
- Follow-ups:
  - Fill and maintain task ownership in `task_registry.md` during active work.
  - Keep project-specific plans inside each project folder/spec.
