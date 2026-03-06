# Project Specification
<!-- Fill this out BEFORE writing any code. This is the primary artifact — code is its expression. -->
<!-- Reference: GitHub Spec Kit workflow (specify → plan → tasks → implement) -->
<!-- Tip: Use the /spec skill to generate a draft from a plain-English description. -->

## 1. Problem Statement
<!-- State the problem so completely that it's plausibly solvable without fetching additional context. -->
<!-- Ask: "Could someone with no access to my brain build this from what's written here?" -->
**What:** AI Mission Control is a Chrome Extension MVP that transforms AI usage tracking into a cinematic data visualization experience, functioning as a "mission control center for your digital brain."
**Who:** Power users of AI tools (like Claude, ChatGPT, Kimi) who want to track their usage, rate limits, and context length, and appreciate high-end, brutalist/glassmorphism aesthetics.
**Why:** Standard AI usage dashboards are boring and static. This extension makes tracking token usage, costs, and limits an engaging, visual, and immersive experience, helping users optimize their AI usage through beautiful, dynamic data representation.

## 2. Acceptance Criteria
<!-- Define "done" with testable statements. An independent observer should verify these without asking questions. -->
<!-- Use checkboxes — these become your demo script and your definition of shipped. -->
- [ ] Chrome extension successfully installs and tracks token usage/activity across target AI platforms (Claude, ChatGPT, Kimi) via content scripts.
- [ ] UI perfectly reflects "Cyber-Luxury Minimalism" (deep space black with noise, glassmorphism cards, dynamic gradients).
- [ ] Popup ("The Theatre", 400x600px) displays live telemetry ticker, 3 liquid-filled gauges, mini heatmap, and sync status.
- [ ] Full Dashboard ("The Observatory") features Life Signs (left), Galaxy View force-directed graph (center), The Ledger (right), and a functional Command Line interface (bottom).
- [ ] Animations run at 60fps utilizing CSS transforms, FLIP techniques for number morphing, spring physics, and Canvas for specific particle effects.
- [ ] Features a dynamic background system that shifts based on usage patterns (Morning, Heavy, Rate limit, Idle).
- [ ] Implements auto-generated charts without user config requirements (Radar charts, Heatmaps, Pulse Waveforms, 3D Cards).
- [ ] Performance constraints are met (Intersection Observer pauses off-screen animations, UI respects reduced motion settings).

## 3. Constraints
### MUST (non-negotiable)
- Run at steady 60fps without layout thrashing.
- Use CSS transforms/animations for primary motion; restrict Canvas usage primarily to particle systems and complex graphs.
- Follow Cyber-Luxury Minimalism visual aesthetic (black/noise background, specific palettes, 10% white opacity glassmorphism).
- Auto-generate visualizations without user configuration.

### MUST NOT (absolute prohibitions)
- Use standard ticking numbers (must use FLIP fluid morphing techniques).
- Have static elements (everything must breathe/move, e.g., variable opacity breathing, liquid ripple effects).
- Cause excessive CPU/GPU drain leading to browser lag.

### PREFER (when multiple approaches exist)
- CSS-powered solutions (e.g., CSS-powered mesh gradients) over heavy WebGL implementations.
- Damped harmonic oscillation (spring physics) over linear easing for entry animations.

### ESCALATE (stop and ask)
- If tracking a specific AI platform's token usage requires bypassing complex security measures that could break frequently or violate critical policies.
- If the 60fps visual density constraint cannot be met on standard hardware using the current tech stack.

## 4. Technical Plan
### Stack
- **Framework:** Chrome Extension Manifest V3 (Vanilla JS/HTML/CSS or a lightweight wrapper like Vite to ensure maximum performance control).
- **Styling:** Vanilla CSS with custom properties for extreme control over glassmorphism, animations, and shadows (avoiding heavy utility classes that might bloat the DOM).
- **Visuals:** CSS 3D transforms, CSS Keyframes, Canvas API (for particles/Galaxy view), lightweight usage of D3 or custom SVG manipulation (for Radar/Heatmaps).

### Architecture
- **Background Service Worker:** Aggregates data, manages Chrome Storage, calculates costs, and acts as the central event bus.
- **Content Scripts:** Injects listeners into Claude, ChatGPT, and Kimi DOMs to detect prompt submission and response generation without interfering with the page.
- **Popup UI:** Renders the "Theatre" view optimized for rapid opening.
- **Dashboard UI:** Dedicated internal extension page rendering the "Observatory" view.
- **Storage:** `chrome.storage.local` for blazing fast read/writes.

### Data Flow
1. Content Script intercepts prompts sent/responses received on AI platform web pages.
2. Content Script estimates tokens/data and sends via message passing to Background Worker.
3. Background Worker updates Chrome Storage and broadcasts a "data_updated" event.
4. Popup/Dashboard UI listens for events, updating local state and triggering visual cascades (e.g., fluid sloshing, notification slide-ins).

## 5. Task Breakdown
### Phase 1: Core Extension & Telemetry (The Engine)
- Initialize Manifest V3 extension boilerplate with Vite base.
- Implement Content Scripts for Claude, ChatGPT, and Kimi to detect messaging activity.
- Build Background Service Worker to aggregate token estimates and manage `chrome.storage.local`.

### Phase 2: The Theatre (Popup MVP) & Cyber-Luxury Base
- Build the CSS foundation: variables, noise overlays, glassmorphism utilities, and spring animations.
- Implement 400x600px popup layout (Header ticker, Center Stage, Lower Third).
- Develop Liquid Filled Gauges and fluid number morphing (FLIP).

### Phase 3: The Observatory (Dashboard MVP) & Advanced Visuals
- Create full-page Dashboard layout (Life Signs, Galaxy View, Ledger, CLI).
- Implement Dynamic Wallpaper System (Aurora, Cyberpunk, Alert, Idle).
- Add remaining visualizations: Radar charts, Pulse Waveforms, 3D Perspective Cards, Particle Streams.
- Optimize for strict 60fps performance and implement Intersection Observers.

## 6. Out of Scope
- Server-side data syncing or cloud backups (fully local for MVP).
- Official API integrations (tracking relies entirely on web interface observation).
- Complex user configuration panels or custom chart builders.
- Support for browsers other than Chrome/Chromium.
- Real-world billing integration.

## Living Document Log
- **[2026-03-06]** Initial spec created for Hackathon Mini Project 1.
