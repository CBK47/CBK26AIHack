# Debrief Log

Purpose: append concise session outcomes. This is not the architecture source of truth.

## Entry Template

- Date:
- Session scope:
- What changed:
- Decisions made:
- Follow-ups:

## 2026-03-07 (CBK-CODEX-MAC-DESK — Prod/Demo Readiness Deep Audit)

- Session scope: deep verification of active Project 4 stack, Drop & Host safety controls, Project5 imported site integrity, and runtime stability evidence.
- What changed:
  - Added `00_SharedResources/prod_demo_readiness_report_2026-03-07.md` with endpoint matrix, gate results, safety tests, port/process inventory, and go/no-go.
  - Re-ran local + public health checks for all active services (`4000-4007`) and tunnel domains; all returned `200`.
  - Re-ran `00_SharedResources/recovery_gate.sh`; result PASS (including drop-host pytest suite).
  - Performed systematic ZIP-vs-live asset diff for imported Project5 sites.
  - Identified one concrete content defect: `p5-kaleo-demo` references `footer-cabin.jpg` that is missing in both source ZIP and deployed folder.
- Decisions made:
  - Mark current state as demo-ready with caveats, not strict production-ready.
  - Treat Kaleo missing image as source package defect (not unzip/import corruption).
- Follow-ups:
  - Patch or re-export Kaleo package with `footer-cabin.jpg`.
  - Add service supervision/watchdog for `4000-4007` + tunnel.
  - Decide if `deployments_index.json` should remain repo-tracked runtime state.

## 2026-03-07 (CBK-CODEX-MAC-DESK — Project 4 Recovery + Project5 Ingestion)

- Session scope: controlled post-crash recovery, deployment hardening, and staged import test of complex guest websites.
- What changed:
  - Added `00_SharedResources/recovery_controlled_rollout.md` with root-cause + prevention workflow.
  - Added `00_SharedResources/recovery_gate.sh` for repeatable gates: health checks, log scan, tests, memory snapshot.
  - Updated `Sites/drop-host/app.py` to serve static assets from deployed site folders (upload ingest still HTML-only).
  - Added `Sites/drop-host/import_project5_site.sh` to import built zip outputs into `uploads/` + `deployments_index.json`.
  - Imported and verified:
    - `p5-filler-demo`
    - `p5-kaleo-demo`
    - `p5-photographer-demo`
  - Updated `task_registry.md`, `handover.md`, and `Project4-Unwise-Probbably/PROJECT_STATUS.md`.
- Decisions made:
  - Use a single execution lane (Codex) for deployment-path work to avoid concurrent mutation conflicts.
  - Use gate checks before every checkpoint commit.
  - Keep upload pipeline HTML-only for now; allow static asset serving for trusted/manual imported multi-file sites.
- Follow-ups:
  - Add file locking for `deployments_index.json` to prevent concurrent write races.
  - Add explicit `drop-host` reload endpoint to avoid hard process restarts when importing manually.

## 2026-03-07 (CBK-CLAUDE-MAC-DESK — P3 Security Hardening + Tunnel)

- Session scope: P3-002, P3-003, P3-004 — backend hardening for JugglesJules before demo sharing.
- What changed:
  - Created `server/auth.ts`: scrypt hashPassword/verifyPassword (Node crypto, no new deps), requireAuth middleware, session type augmentation.
  - `server/index.ts`: express-session + memorystore wired in. SESSION_SECRET from env with warning if missing. httpOnly cookie, secure in prod, 7-day maxAge.
  - `server/routes.ts`: register hashes password; login uses verifyPassword; session set on login/register; POST /api/auth/logout + GET /api/auth/me added. requireAuth applied to all private routes. IDOR fixes: PATCH /api/user/:id checks ownership; PATCH /api/session/:id checks session owner; training-goal PATCH/DELETE verify ownership; forum delete uses session instead of spoofable query param.
  - `cloudflare-tunnel.sh`: quick-tunnel script, auto-installs cloudflared on Mac/Ubuntu/RHEL.
- Decisions made:
  - No new npm deps (scrypt built-in, memorystore already listed).
  - Existing plaintext-password users in DB will fail login — need re-registration or manual re-hash.
  - All routes gated behind requireAuth for now; relax leaderboard/tricks reads later if desired.
- Follow-ups:
  - Set SESSION_SECRET env var before deploy.
  - For stable tunnel URL, create a named Cloudflare tunnel with a CF account.
  - P3-005 full security audit still todo.

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
