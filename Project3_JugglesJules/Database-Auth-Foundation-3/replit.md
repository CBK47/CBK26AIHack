# Just Juggle - Personal Juggling Trainer

## Overview
A comprehensive juggling training application that helps jugglers of all levels learn, practice, track progress, and stay motivated. Includes community features, a shop economy, and a Pro Metronome.

## Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State**: Zustand (auth), TanStack Query (server state)
- **Routing**: wouter
- **Charts**: recharts
- **PDF**: jspdf (weekly reports)
- **PWA**: vite-plugin-pwa, workbox
- **Animation**: framer-motion
- **Audio**: Web Audio API (metronome sine wave beeps), Web Speech API (audio cues)

## Project Structure
```
client/src/
  components/
    app-sidebar.tsx       - Navigation sidebar (12 nav items + profile link)
    metronome.tsx          - Pro Metronome (full + mini) with Web Audio API, locked/unlocked states
    theme-provider.tsx    - Dark/light mode context
    theme-toggle.tsx      - Theme toggle button
    ui/                   - shadcn/ui components
  pages/
    auth.tsx              - Login/register page
    dashboard.tsx         - Main dashboard with stats, coins, XP
    training.tsx          - Training session generator with audio cues, hands-free mode (metronome + voice drop)
    speech.ts             - useSpeechRecognition hook (Web Speech API, keyword detection with cooldown)
    trick-library.tsx     - Browse/search tricks with mastery badges
    stats.tsx             - Analytics charts + weekly PDF download
    sequences.tsx         - Custom sequence builder with playback
    progression.tsx       - Trick mastery tree + badge collection
    height-challenge.tsx  - Camera-based height alignment tool
    games.tsx             - Games hub with 6 mini-games
    shop.tsx              - Pro Shop: buy themes, features, tricks with coins
    profile.tsx           - Profile editing, theme editor, goals, notifications with daily reminders
    community.tsx         - Friends, challenges, leaderboards, share progress
    forum.tsx             - Discussion board with categories, posts, comments
  lib/
    auth.ts               - Zustand auth store with localStorage
    queryClient.ts        - TanStack Query config
    notifications.ts      - Browser push notification scheduling for daily reminders
  App.tsx                 - Root component with routing, layout, theme applier, reminder scheduler

server/
  index.ts                - Express server entry
  routes.ts               - API endpoints (incl. PDF report, game results, goals, community, forum, shop)
  storage.ts              - Database storage layer (IStorage interface)
  db.ts                   - PostgreSQL connection via Drizzle
  seed.ts                 - 40 tricks with prerequisite chains + 4 shop items (themes, metronome, trick)
  xp.ts                   - XP processing, badge checks, coin awards, streak calc

shared/
  schema.ts               - Drizzle schema: users, tricks, sessions, session_tricks, user_tricks, achievements, game_results, training_goals, friendships, challenges, forumPosts, forumComments, shopItems, userPurchases
  badges.ts               - Badge catalog (22 badges across 4 categories)
```

## Database Tables
- **users**: Auth, XP, level, coins, streak, theme preference, displayName, preferredStyle, skillLevel, notificationsEnabled, reminderTime, reminderMessage
- **tricks**: Trick library (name, siteswap, difficulty, props, tips, prerequisites, isCustom flag for user-contributed tricks)
- **sessions**: Training session metadata
- **session_tricks**: Per-trick performance within a session
- **user_tricks**: User mastery per trick (unlocked status, personal best, mastery score)
- **achievements**: Earned badges/achievements
- **game_results**: Scores from mini-games (gameType, score, timeSeconds, drops, metadata JSON)
- **training_goals**: User-defined goals with target dates and completion status
- **friendships**: Friend requests between users (requesterId, receiverId, status: pending/accepted/declined)
- **challenges**: Friend challenges on mini-games (senderId, receiverId, gameType, targetScore, scores, status)
- **forumPosts**: Discussion board posts (userId, title, content, category: tips/questions/show-off/general)
- **forumComments**: Comments on forum posts (postId, userId, content)
- **shopItems**: Shop catalog (name, type: trick/theme/sound/feature, description, price, requirement, data JSON)
- **userPurchases**: Records of user purchases (userId, itemId, purchasedAt)

## Key Features
1. **Dashboard**: Stats overview, XP progress, coins display, recent session, quick actions
2. **Training**: Generate sessions based on time/energy/focus, drop tracking, audio cues (Web Speech API), hands-free mode (metronome auto-counts catches, voice "Drop" via Web Speech API, 3s countdown), XP/coin awards, badge notifications, mastery achievement dialog
3. **Games**: 6 mini-games — Cascade Count (target mode + Free Run endless mode with streak tracking), Flash (with How to Play instructions), Siteswap Challenge, Height Challenge (timed), Balance & Juggling (randomized pattern+pose pairings with Re-roll), Sequence Challenge; personal best tracking
4. **Trick Library**: Search, filter by difficulty/prop type/object count, mastery progress bars, user-contributed tricks with "Community" badge, "Add New Trick" form
5. **Stats**: Line/bar/pie charts for drops, practice time, mood, focus distribution + weekly PDF report download
6. **Sequence Builder**: Custom routines with playback and audio cues
7. **Progression**: Visual trick mastery tree with prerequisite tracking + badge collection grid (22 badges)
8. **Height Challenge**: Camera-based tool with draggable SVG guide lines for consistent throw height
9. **Profile**: Edit personal details, 6+ color themes (+ shop themes), training goals with dates, notification toggles, daily reminder time picker
10. **PWA**: Installable as standalone app with offline caching
11. **Community**: Friends system (search, add, accept/decline), challenge friends on games, global/friends leaderboards, share progress/stats
12. **Forum**: Discussion board with category filters (Tips, Questions, Show Off, General), create/delete posts, comments
13. **Pro Shop**: Buy themes (Midnight Purple, Electric Lime), features (Pro Metronome), and tricks (Mills Mess) with coins. Level requirements enforced.
14. **Pro Metronome**: BPM slider (60-180), start/stop, visual pulse, Web Audio API sine wave beeps. Locked behind shop purchase. Mini version in training page.

## API Routes (Shop)
- `GET /api/shop/items` — Get all shop items
- `GET /api/shop/purchases/:userId` — Get user's purchases
- `POST /api/shop/buy` — Buy item { userId, itemId } (validates coins, requirement, creates purchase, deducts coins, adds trick if type=trick)

## API Routes (Community/Forum)
- `GET /api/users/search?q=` — Search users by username
- `GET /api/friends/:userId` — Get friendships (pending + accepted)
- `POST /api/friends` — Send friend request
- `PATCH /api/friends/:id` — Accept/decline friend request
- `DELETE /api/friends/:id` — Remove friendship
- `GET /api/challenges/:userId` — Get user's challenges
- `POST /api/challenges` — Create challenge
- `PATCH /api/challenges/:id` — Update challenge (score/status)
- `GET /api/forum/posts` — Get forum posts (optional ?category= filter)
- `GET /api/forum/posts/:id` — Get single post
- `POST /api/forum/posts` — Create post
- `DELETE /api/forum/posts/:id` — Delete own post
- `GET /api/forum/posts/:postId/comments` — Get post comments
- `POST /api/forum/comments` — Create comment
- `DELETE /api/forum/comments/:id` — Delete own comment
- `GET /api/leaderboard/:gameType` — Top scores for game type

## Gamification System
- **XP**: 1 XP per catch, +100 bonus XP on trick mastery (100 catches)
- **Levels**: Level = floor(totalXP / 100) + 1
- **Coins**: 1 coin per 10 XP earned (based on total XP). Spent in Pro Shop.
- **Badges**: 22 achievements across session, skill, streak, and special categories
- **Milestones**: Apprentice (30 catches), Mastered (100 catches) per trick
- **Streak**: Consecutive day tracking with badge rewards at 3, 7, 30 days
- **Games**: 6 mini-games with scoring and personal best tracking

## Shop Economy
- Coins earned automatically via XP system (1 coin per 10 XP)
- Shop items seeded on startup: 2 themes (50 coins each), 1 feature (100 coins), 1 trick (200 coins, requires Level 5)
- Purchase deducts coins, prevents duplicate purchases, enforces level requirements
- Trick purchases auto-create the trick in the tricks table

## Pro Metronome
- Web Audio API oscillator: 880Hz sine wave, 50ms beep per beat
- BPM range: 60-180, controlled via Slider
- Visual pulse indicator (circle that scales/glows on beat)
- Locked state shows overlay with link to shop; unlocked state renders full controls
- Mini version embedded in training page during active practice
- Full version available standalone (accessible from shop page)

## Daily Reminders
- Browser Notification API used for daily practice reminders
- User sets time (HH:MM) and custom message in Profile > Notification Preferences
- Reminder scheduled on app load via setInterval checking every 30s
- Fires once per day using date-key dedup in localStorage

## Color Themes
Available themes (stored in user.preferredTheme): purple (default), blue, green, orange, rose, teal + shop themes (Midnight Purple hue:280, Electric Lime hue:80). Applied via CSS custom properties on --primary hue.

## Authentication
Simple username/password auth stored in PostgreSQL. Session state managed client-side via Zustand with localStorage persistence.

## Notes
- Email notifications (SendGrid) deferred — revisit later when API key available
- Community features use per-userId queries to resolve usernames in posts/comments/friends
