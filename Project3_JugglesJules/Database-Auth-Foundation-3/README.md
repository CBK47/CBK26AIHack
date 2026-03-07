🤹‍♂️ Just Juggle - Personal Juggling Trainer
An Astro-based web application designed for hands-free juggling practice. It features metronome-synced catch counting, voice-activated "Drop" logging, and a 3D/Video trick library.

## Ports

| Port | Service | Command |
|---|---|---|
| 3001 | Express app (production) | `PORT=3001 npm start` |
| 3002 | Vite dev server | `PORT=3002 npm run dev` |

Range: 3xxx (P3 — JugglesJules). Full registry: `00_SharedResources/port_registry.md`

Required env vars: `DATABASE_URL`, `SESSION_SECRET`

---

🚀 Quick Start for Hosting
1. Prerequisites
Node.js: Version 18 or higher.

HTTPS: This app requires a secure connection (SSL) for the Microphone (Speech Recognition) and Camera (Height Challenge) to function.

2. Installation
Bash
# Install dependencies
npm install

3. Database
Install dependencies with npm install
Set up a PostgreSQL database and environment variables
npm run db:push to create the tables
psql $DATABASE_URL -f export.sql to import all the data
Optionally re-export anytime with npx tsx scripts/export-db.ts

5. Build and Deploy
Bash
npm run build
npm run preview # To test the production build locally
🛠 Tech Stack
Framework: Astro (Islands Architecture)

UI Components: Svelte (for high-performance timers and camera overlays)

Styling: Tailwind CSS

APIs: Web Speech API (Voice commands) & Web Audio API (Precise Metronome)

🎯 Key Features
Hands-Free Mode: Uses a metronome to count catches automatically. Say "Drop" to stop the timer and log the session.

Trick Library: Pre-loaded with 40+ tricks ranging from Level 1 (Cascade) to Level 5 (7-Ball Cascade).

XP System: 1 XP per catch, 100 XP per mastered trick.

Height Challenge: Visual SVG overlay to help align throw heights.