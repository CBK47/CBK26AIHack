# AI Mission Control — Chrome Extension

> A cinematic data visualisation experience for AI usage tracking across Claude, ChatGPT, and Kimi.

**Version:** 0.2.0 (Phase 1 POC complete — Phase 2 in progress)
**Manifest:** V3 | **Platforms:** Chrome/Chromium
**Tech:** Vanilla JS · CSS Custom Properties · Chrome Extension APIs

---

## What It Does

A Chrome Extension with two UI panels:

| Panel | File | Purpose |
|---|---|---|
| **The Theatre** (popup) | `extension/popup/` | 320px quick-glance token gauges, opens on extension click |
| **The Observatory** (dashboard) | `extension/dashboard/` | Full-screen analytics: pulse lines, heatmap, settings |

Three AI platforms tracked: **Claude** · **ChatGPT** · **Kimi**

---

## Project Structure

```
extension/
├── manifest.json          # MV3 config — permissions, host_permissions, content scripts
├── background.js          # Service worker: data hub, Claude API sync
├── content.js             # Injected into AI sites: detects usage submissions for token estimation
├── tokens.css             # Shared design tokens (colours, spacing, shadows)
├── popup/
│   ├── popup.html         # Extension popup (The Theatre)
│   ├── popup.js           # Popup logic: renders gauges, handles theme/colour
│   └── popup.css          # Popup styles
└── dashboard/
    ├── dashboard.html     # Full-screen dashboard (The Observatory)
    ├── dashboard.js       # Dashboard logic: gauges, pulse lines, heatmap, settings
    └── dashboard.css      # Dashboard styles
```

Supporting docs:
- `spec.md` — Full product specification
- `api_research.md` — API endpoint research for all three platforms
- `opus_handoff.md` — Phase 1 → 2 handoff notes
- `user_guide.md` — Installation instructions

---

## ⚠️ Where Usage Data Comes From

**This is critical to understand before extending the project.**

There are currently **two separate mechanisms** for usage telemetry:

---

### Mechanism 1 — Content Script (Usage Event Detection)

**File:** `extension/content.js`
**Runs in:** Page context of `claude.ai`, `chatgpt.com`, `kimi.moonshot.cn`, `www.kimi.com`

What it does:
1. Identifies the platform from `window.location.hostname`
2. Captures composer text via `document.addEventListener('input')` on textareas/contenteditable elements
3. Detects submission via:
   - `Enter` keydown (non-Shift) on a textarea/contenteditable
   - Click on likely send/submit buttons using explicit attributes and labels
4. Sends a message to the background worker:
   ```js
   chrome.runtime.sendMessage({ type: 'PROMPT_SENT', payload: { platform, textLength } })
   ```

**Token estimation:** `Math.ceil(textLength / 4)` — naive character-count approximation, not real tokens.

**Known limitations:**
- Still heuristic and can drift when platform DOMs change
- Uses estimated token math from text length
- Does not yet read true model token usage from every provider

---

### Mechanism 2 — Background API Sync (Claude only, heuristic parser)

**File:** `extension/background.js` → `syncClaudeUsage()`
**Trigger:** Double-click the header in the popup, or `FORCE_SYNC_CLAUDE` message

What it currently does:
1. `fetch('https://claude.ai/settings/usage')` — works because `host_permissions` includes `*://claude.ai/*`, so session cookies are sent automatically
2. Checks if the HTML response contains `<script id="__NEXT_DATA__">` (Next.js embedded JSON)
3. Parses `__NEXT_DATA__` with heuristic token-field matching and updates stored usage/limit when matching fields are found

What it needs to do (Phase 2):
```
GET https://api.claude.ai/api/organizations
  → extract org UUID
GET https://api.claude.ai/api/organizations/{uuid}/usage  (or similar)
  → parse real token counts / limits
```
See `api_research.md` for per-platform endpoint research.

---

### How Data Flows into the UI

```
AI Platform DOM
    │
    ▼
content.js  ──(PROMPT_SENT message)──▶  background.js
                                              │
                                    chrome.storage.local
                                    key: 'aiUsage'
                                    {
                                      claude:  { estimatedTokens, tokenLimit, rawData, lastSyncAt },
                                      chatgpt: { estimatedTokens, tokenLimit, rawData, lastSyncAt },
                                      kimi:    { estimatedTokens, tokenLimit, rawData, lastSyncAt }
                                    }
                                              │
                        ┌─────────────────────┘
                        │
                  chrome.storage.onChanged
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
       popup.js                dashboard.js
       renderData()             renderData()
            │                       │
     Gauge fill level         Gauge fill level
     Token count display      Token count display
     Limit display            Total tokens
                              Pulse canvas animation
```

**Gauge fill formula** (both popup and dashboard):
```js
const limits = { chatgpt: 100000, claude: 100000, kimi: 100000 }; // HARDCODED — needs real limits
let percent = Math.max(5, Math.min(95, (data.estimatedTokens / limits[platform]) * 100));
```
These limits are hardcoded at 100,000 tokens — **not real subscription limits**.

---

### Storage Keys (`chrome.storage.local`)

| Key | Type | Description |
|---|---|---|
| `aiUsage` | Object | Core metrics: `{ claude, chatgpt, kimi }` each with `estimatedTokens`, `tokenLimit`, `rawData`, `lastSyncAt` |
| `platformSettings` | Object | Visibility + feature toggles: `{ claude, chatgpt, kimi, history, github }` |
| `uiDarkMode` | Boolean | Dark mode state |
| `uiColorScheme` | String | `'blue'` \| `'peak'` \| `'red'` |

---

## UI Component Map

### Popup (`popup.html` / `popup.js`)

| Element | ID | Driven By |
|---|---|---|
| Gauge fill level | `fill-{platform}` | `--fill-level` CSS property |
| Token count | `val-{platform}` | `aiUsage[platform].estimatedTokens` |
| Token limit | `limit-{platform}` | `aiUsage[platform].tokenLimit` |
| Status ticker | `ticker-text` | Updated on storage change |
| Theme toggle | `theme-toggle` | Writes `uiDarkMode` to storage |
| Colour selector | `color-selector` | Writes `uiColorScheme` to storage |
| Open dashboard | `open-dashboard` | `chrome.tabs.create()` |

**Hidden trigger:** Double-click the ticker header → triggers `FORCE_SYNC_CLAUDE`

### Dashboard (`dashboard.html` / `dashboard.js`)

| Element | ID/Selector | Driven By |
|---|---|---|
| Big gauges | `fill-{platform}`, `val-{platform}`, `limit-{platform}` | Same as popup |
| Total tokens | `total-tokens` | Sum of all enabled platforms |
| Heatmap | `heatmap` | **Random placeholder data** — not real history |
| Pulse lines | `.pulse-canvas` | CSS sine wave animation, not data-driven |
| Platform toggles | `.toggle-input[data-platform]` | Writes `platformSettings` to storage |
| Feature toggles | `.toggle-input[data-feature]` | Writes `platformSettings` to storage |

---

## Design System

Shared tokens in `extension/tokens.css`. Applied via `data-theme` and `data-color` attributes on `<html>`.

| Token | Light | Dark |
|---|---|---|
| `--bg-primary` | `#f5f6fa` | `#0f1117` |
| `--bg-secondary` | `#ffffff` | `#1a1c25` |
| `--text-primary` | `#1a1a2e` | `#f0f0f5` |
| `--accent` (blue) | `#3b82f6` | `#60a5fa` |
| `--accent` (peak) | `#e5a800` | `#e5a800` |
| `--accent` (red) | `#ef4444` | `#ef4444` |

Brand colours (not themed, always fixed):
- Claude: `#d97757`
- ChatGPT: `#10a37f`
- Kimi: `#6366f1`

Font: **Inter** (Google Fonts, 400–900 weights)

---

## Installation (Dev Mode)

1. Clone repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer Mode**
4. **Load unpacked** → select the `extension/` folder
5. Visit `claude.ai`, `chatgpt.com`, or `kimi.moonshot.cn` and start chatting

---

## Phase Roadmap

### ✅ Phase 1 — POC Complete
- Extension scaffolding (MV3, service worker, content scripts)
- Popup and dashboard UI with animated gauges
- Heuristic prompt detection via content script
- Token estimation (`textLength / 4`)
- Theme system (light/dark, 3 colour schemes)
- Claude usage page fetch (stub — confirms endpoint, doesn't parse)

### 🔄 Phase 2 — Real Data (Next Priority)
- [ ] Parse `__NEXT_DATA__` from `claude.ai/settings/usage` to extract real token usage and subscription limits
- [ ] Research and implement ChatGPT usage endpoint (`/backend-api/conversations` → message length sum)
- [ ] Research and implement Kimi usage endpoint
- [ ] Replace hardcoded `limits = 100000` with real subscription limits per platform
- [ ] Wire `platformSettings` toggles fully (visibility already works; feature toggles are stubs)
- [ ] Replace heatmap random data with actual stored usage history

### 📋 Phase 3 — Enhancements
- [ ] Usage history: persist daily snapshots, display 4-week heatmap
- [ ] Archived modules reassessment (`extension/archvied/`)
- [ ] GitHub integration toggle
- [ ] Rate-limit API sync (once/hour max, cache between openings)
- [ ] Intersection Observer on pulse canvases (pause when off-screen)

---

## Key Constraints for Contributors

- **No real token counts yet** — all numbers are estimates based on input character length
- **No authentication handling** — relies on the user being logged in; session cookies are passed automatically via `host_permissions`
- **No rate limiting** on API sync — must be added before Phase 2 ships
- **Default token limits** fallback to 100,000 when provider limits are unavailable
- **Heatmap is fake** — `dashboard.js:174-181` generates random cells
- **Pulse lines are decorative** — sine wave animation, not data-driven
- **`rawData` field** on Claude storage is a debug string, not structured data
- **Prompt count and cost features are archived** in `extension/archvied/`

---

## Contributing / Multi-Model Handoff Notes

When continuing work on this codebase:

1. **Read `spec.md` first** for the full vision and UX intent
2. **Read `api_research.md`** before touching any API fetching code
3. **Check `opus_handoff.md`** for Phase 1 decisions and rationale
4. The two most important files to understand are `background.js` (data pipeline) and `content.js` (data source)
5. Both `popup.js` and `dashboard.js` are essentially rendering-only — they read from storage, never write usage data
6. Theme/settings state is the only thing the UI writes back to storage
