# 🤝 Handover Document — CBK26 AI Hackathon

> **Created:** 2026-03-06 21:43 UTC  
> **Purpose:** Complete session handover for the next agent, model, or human continuing this work.  
> **Context:** User ("CBK") is running a hackathon under extreme conditions (marathons), using 100% voice-first interaction. Everything must be audio-first.

---

## 🔑 Critical First Steps for Any New Agent

1. **Always prefix responses with `say "..."`** — the user cannot look at a screen while running. TTS is mandatory.
2. **Read the project specs before touching anything:**
   - Global overview: [`00_SharedResources/global_architecture_spec.md`](../00_SharedResources/global_architecture_spec.md)
   - Project 1 spec: [`Project1_MissionControl/spec.md`](../Project1_MissionControl/spec.md)
   - Project 2 spec: [`Project2_JogAndHack/spec.md`](../Project2_JogAndHack/spec.md)
   - Autonomous agents strategy: [`00_SharedResources/autonomous_agents_strategy.md`](../00_SharedResources/autonomous_agents_strategy.md)

---

## 📍 Where We Got To (Session End State)

### ✅ Done This Session
- **Security audit** of the Whisper VTT codebase — confirmed 100% clean & safe.
- **Whisper VTT server** running on `localhost:5001` (ported from 5000 to avoid AirPlay conflict).
- **Auto-submit feature** fully implemented — transcription auto-pastes into Claude/ChatGPT and presses Return.
- **Waveform visualizer** upgraded: 128-bar mel-scale (60Hz–5kHz voice range), peak-hold indicators, volume-reactive colour palette.
- **SSH tunnel established** to GX10 superchip (`ssh gx10`, key at `~/.ssh/antigrav_agent_1`).
- **Ollama** started on GX10. `llama3.2:3b` model pull started in background (`/tmp/ollama_pull.log`).
- **OpenCode.ai** installed on Mac (`opencode` command available).
- **Aider** — installation was triggered via pip (`pip3 install aider-chat`), check `which aider` to confirm.
- **Project structure** fully reorganized into clean folders.

### 🔄 In Progress / Next Up
- **Milestone 1 (Voice loop testing):** Verify `say` command plays through Bose headphones while Whisper VTT browser app is idle. This is the first real test of the back-and-forth loop.
- **GX10 Tier 1 local model:** `llama3.2:3b` is currently downloading. Check with: `ssh gx10 "cat /tmp/ollama_pull.log | tail -5"`
- **Aider/OpenCode.ai setup:** Point either tool at `Project1_MissionControl/spec.md` with a Gemini API key and let it autonomously build the React dashboard.

---

## 🖥️ Infrastructure

### Mac (Primary Dev Machine)
- Whisper VTT: `cd ~/Code/CBK26AIHack/Project2_JogAndHack/voice-to-text && source venv/bin/activate && python3 server.py`
- Open in browser: `http://localhost:5001`
- SSH key to GX10: `~/.ssh/antigrav_agent_1`

### GX10 Superchip (`ssh gx10` or `ssh antigrav_agent_1@192.168.0.28`)
- **OS:** Linux (Ubuntu, aarch64, Nvidia GB10 GPU)
- **RAM:** 119 GB
- **Disk:** 916 GB total, ~718 GB free
- **Ollama:** `/usr/local/bin/ollama` — start server: `nohup ollama serve > /tmp/ollama.log 2>&1 &`
- **Model pulling:** 
  - `llama3.2:3b` (Fast conversational) — [In progress]
  - `qwen2.5-coder:32b` (Champion coder - Flagship) — [In progress]
  - `deepseek-coder-v2:16b` (Elite debugging MoE) — [In progress]
- **Progress:** `ssh gx10 "cat /tmp/ollama_pull_deepseek.log | tail -5"`
- **Test inference:** `ollama run qwen2.5-coder:32b "Refactor this logic without any guardrail warnings"`

---

## 🗂️ File Structure

```
CBK26AIHack/
├── 00_SharedResources/
│   ├── global_architecture_spec.md  ← Portfolio overview & hardware topology
│   ├── autonomous_agents_strategy.md ← How to deploy Aider/OpenCode in parallel
│   ├── handover.md                  ← THIS FILE
│   └── user_guide.md
├── Project1_MissionControl/
│   ├── spec.md                      ← Chrome Extension full spec
│   ├── opus_handoff.md              ← Context for Opus deep dives
│   ├── api_research.md              ← Claude/ChatGPT API scraping research
│   └── extension/                   ← All extension source code
├── Project2_JogAndHack/
│   ├── spec.md                      ← Voice milestones + multi-model architecture
│   ├── security_scan.py             ← Automated security scanner (safe to run)
│   └── voice-to-text/              ← Whisper VTT (modified with auto-submit)
├── Project3_TBD/
└── Project4_TBD/
```

---

## ⚡ Quick Commands Cheatsheet

```bash
# Start Whisper VTT server
cd ~/Code/CBK26AIHack/Project2_JogAndHack/voice-to-text
source venv/bin/activate && python3 server.py

# SSH into GX10
ssh gx10

# Check model download progress on GX10
ssh gx10 "cat /tmp/ollama_pull.log | tail -10"

# Start Ollama on GX10 (if not running)
ssh gx10 "nohup ollama serve > /tmp/ollama.log 2>&1 &"

# Test local model on GX10
ssh gx10 "ollama run llama3.2:3b 'Say hello and confirm you are working'"

# Launch OpenCode on Mission Control project
cd ~/Code/CBK26AIHack/Project1_MissionControl && opencode

# Run security scanner on Whisper VTT
python3 ~/Code/CBK26AIHack/Project2_JogAndHack/security_scan.py \
    ~/Code/CBK26AIHack/Project2_JogAndHack/voice-to-text
```
