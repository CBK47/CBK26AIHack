# AI Mission Control - Opus Handoff Document

## Current State of the Project
We have successfully built the **Phase 1 Proof of Concept (POC)** for a Chrome Extension called "AI Mission Control" designed to track AI usage on Claude, ChatGPT, and Kimi.

### Vibe & Aesthetic
The strict design philosophy is **"Cyber-Luxury Minimalism."** Think Apple designing a spaceship cockpit. Deep space blacks (`#050505`), glassmorphism cards (10% opacity, 20px blur), CSS noise overlays, and vibrant brand-matching neon accents. 
All animations run at strict **60fps using pure CSS** transforms and spring physics (no layout thrashing).

### What is Built
1. **The Extension Core (`manifest.json`, `background.js`)**: Manifest V3 extension with storage and host permissions.
2. **The Theatre (`popup.html`, `popup.css`, `popup.js`)**: A 400x600px popup featuring three fully functional "Liquid Gauges" (CSS simulated fluid using hidden overflows and rotating borders). The numbers animate via a custom JS FLIP function (`animateValue`).

### The Strategic Pivot
Originally, we built a DOM listener (`content.js`) to estimate tokens based on keystrokes. We are **ABANDONING** this approach.

Instead, we are pivoting to **Web Subscription Data Extraction**. We want the extension to use the user's active session cookies to pull their official subscription limits and usage directly from the web fronts (e.g., fetching `https://claude.ai/settings/usage` from the background script to see how many messages they have left in their 3-hour limit).

---

## Your Tasks (Phases 2 & 3)

### Task 1: Web Subscription Data Extraction (Claude First)
Your immediate goal is to finalize the logic in `background.js` to extract the user's *Personal/Pro Subscription Limits* from Claude. 
- **Claude:** Fetch `https://claude.ai/settings/usage` from the background script. Parse the HTML or Next.js JSON blob (`__NEXT_DATA__`) to extract subscription limits.
- **Kimi:** Fetch `https://www.kimi.com/code/console` from the background script. Parse usage/quota data shown on that page.
- **ChatGPT:** Investigate equivalent usage page (likely hidden in settings or account).
- Feed this exact subscription data into Chrome Storage so the Liquid Gauges reflect actual limits, not estimates.

### Task 2: "The Observatory" (Full-Screen React Dashboard)
The user wants a full-screen, dedicated web application bundled inside the extension for heavy configuration and deep historical analytics.
- Scaffold a React/Vite app inside the extension.
- Maintain the exact same Cyber-Luxury aesthetic (reusing the `popup.css` variables).
- Hook it up to `chrome.storage.local` and `chrome.runtime.sendMessage` to sync state with the new Background fetchers.

### Task 3: Usage History Toggle (Clock Icon)
Add a toggle switch (styled with a clock/history icon) that lets users switch between:
- **Current Usage**: Shows live/current subscription limits and remaining messages.
- **Historical Usage**: Shows past usage over time (daily/weekly/monthly trends).

The toggle should use the same Cyber-Luxury aesthetic — dark glassmorphism pill-shaped switch with a subtle glow on the active state. When toggled, the gauges and data views should smoothly animate/transition between current and historical data views.

### Task 4: GitHub Integration Toggle (GitHub Icon)
Add a toggle switch (styled with the GitHub Octocat icon) that enables/disables GitHub integration features:
- When **ON**: Tracks and displays AI usage tied to coding sessions (e.g., Codex usage, Copilot-style metrics).
- When **OFF**: Hides GitHub-related metrics from the dashboard.

This toggle should also appear in the full-screen Dashboard settings panel, letting users configure which integrations are active. Both toggles should be styled as dark pill-shaped switches with icon indicators, matching the reference UI the user provided.

*Note: You have access to `/Users/cbk/Code/CBK26AIHack/spec.md` and `/Users/cbk/.gemini/antigravity/brain/065677b3-4e02-44c0-ba75-cb32d856f794/task.md` for full architectural blueprints.*
