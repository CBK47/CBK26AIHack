# 🤖 Massively Parallel Autonomous Agent Strategy

> **Goal:** Stop sequential pair-programming. Transition to a "fire-and-forget" orchestration model where multiple AI agents work on different areas of the hackathon simultaneously while you jog.

The current bottleneck is that we are working in series: you prompt me, I write code, I wait for your next prompt. Since you have heavy token limits available (specifically via Gemini), we need to deploy **fully autonomous terminal agents** that can parse a spec file, traverse a codebase, write files, run tests, and fix their own bugs without your intervention.

---

## 🛠️ The Recommended Tool: Aider (or OpenDevin)

I strongly recommend spinning up **Aider** (`aider-chat`) in a tmux session or small local VM. It is specifically designed to be an autonomous terminal agent.

### Why Aider?
1. **Fire & Forget:** You can give it a massive prompt (like "Build the React dashboard using Project1/spec.md") and walk away for 30 minutes. It will write the code, run the build commands, see the errors, and rewrite the code to fix them autonomously.
2. **Model Swapping:** It connects trivially to both Gemini 1.5 Pro and Claude 3.5 Sonnet.
3. **Token Efficiency:** It manages its own repository map (via ctags), meaning it won't blow your massive token budget entirely on blindly sending the whole repo over and over.

*Alternative: OpenDevin runs in a Docker container and is highly isolated, but harder to configure quickly mid-hackathon.*

---

## 🚀 The Multi-Threading Hackathon Strategy

Here is exactly how we split the labor to maximize your subscriptions:

### Thread 1: The "Heavy Duty" Parallel Worker (Project 1 - React Dashboard)
This tasks requires massive context parsing, writing hundreds of lines of boilerplate React/Vite code, and styling.
- **The Agent:** Aider running in a background terminal session.
- **The Model:** `gemini-1.5-pro-latest` (since you have a high token limit and it has a 1M context window perfect for absorbing the entire `Project1_MissionControl/spec.md`).
- **The Prompt you give it:** 
  > *"Read Project1_MissionControl/spec.md and Project1_MissionControl/opus_handoff.md. Initialize a new React+Vite app in the `Project1_MissionControl/observatory` folder. Recreate the 'Cyber-Luxury Minimalism' CSS variables and implement the base layout of the Observatory dashboard with mock data. Run `npm run dev` and fix any build errors until it works perfectly. Do not ask for help, just build."*
- **Your involvement:** 0%. Let it run for 40 minutes while you jog.

### Thread 2: The "Conversational Bleeding-Edge" Worker (Project 2 - Voice System)
This requires complex Python scripting, debugging macOS audio APIs, and AppleScript injection. It needs high-precision reasoning and back-and-forth iteration.
- **The Agent:** Antigravity (Me, currently inside your IDE).
- **The Model:** `Claude 3.5 Opus` (or `Claude 3.5 Sonnet` depending on the complexity of the specific sprint).
- **Your involvement:** 100% voice interaction via Whisper VTT. We tackle the complex "hard" problems together in real-time.

---

## 💻 How to Spin It Up Right Now

1. Open a new terminal on your Mac (or SSH into your GX10).
2. Install Aider (if you don't have it):
   ```bash
   python3 -m pip install aider-chat
   ```
3. Export your Gemini API key (since you have plenty of quota):
   ```bash
   export GEMINI_API_KEY="your-api-key"
   ```
4. Start the autonomous sequence in the background:
   ```bash
   aider --model gemini/gemini-1.5-pro-latest --message "Read Project1_MissionControl/spec.md and build the full React dashboard in the Project1_MissionControl/dashboard_app directory. Run tests recursively until the UI builds."
   ```

By running this process, you effectively have a Junior/Mid-level dev building Project 1 for free in the background using Gemini, while you and I (Opus/Sonnet) focus purely on Project 2's voice integration.
