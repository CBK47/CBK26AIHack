# Prod/Demo Readiness Report (2026-03-07)

## Scope
Deep stability and readiness verification for active hackathon services, with focus on:
- Project 4 stack (`4000-4007`) + Cloudflare tunnel exposure
- Drop & Host deployment pipeline safety and correctness
- Project5 imported site integrity (`p5-filler-demo`, `p5-kaleo-demo`, `p5-photographer-demo`)
- Port/process/resource baseline and log health

Audit date: 2026-03-07

## Executive Verdict
Status: **Demo-ready with one content defect and two operational caveats**

- All core local/public services are up and responding `200`.
- Recovery gate script passes end-to-end, including Drop & Host pytest suite.
- Upload safety controls (extension allowlist, prompt-injection block, rate limiting) are active.
- Confirmed defect: `p5-kaleo-demo` references missing `footer-cabin.jpg` (404), causing visual break in that section.
- Operational caveats: runtime process management is screen/manual; dynamic deployment index is mutable runtime state in repo.

## Environment Snapshot
- Host: macOS arm64
- Git branch: `main`
- Active P4 listeners: `4000-4007`
- Cloudflared metrics listener: `127.0.0.1:20241`
- Reserved system conflicts present: `5000`, `7000` (ControlCenter/AirPlay)

## Runtime/Port Checks
Verified listeners:
- `4000` swarm-command
- `4001` freywill
- `4002` compute-rental
- `4003` auto-miner
- `4004` hackathon-hosting
- `4005` drop-host
- `4006` x402-shared
- `4007` linktree

Additional listeners observed:
- `5000`, `7000` ControlCenter (expected conflict on macOS)
- `24800-24803` synergy components
- `20241` cloudflared metrics endpoint

## Endpoint Health Matrix
All checks below returned `200` during this audit.

Local:
- `http://127.0.0.1:4000/`
- `http://127.0.0.1:4000/research/swarm-report.pdf`
- `http://127.0.0.1:4001/`, `/health`, `/.well-known/x402`
- `http://127.0.0.1:4002/`, `/api/earnings`
- `http://127.0.0.1:4003/`, `/api/status`
- `http://127.0.0.1:4004/`
- `http://127.0.0.1:4005/`, `/api/sites`, `/p5-filler-demo/`, `/p5-kaleo-demo/`, `/p5-photographer-demo/`
- `http://127.0.0.1:4006/`, `/api/stats`, `/.well-known/x402`
- `http://127.0.0.1:4007/`

Public:
- `https://swarm.aihack26.xyz/`
- `https://swarm.aihack26.xyz/research/swarm-report.pdf`
- `https://freywill.aihack26.xyz/`, `/health`, `/.well-known/x402`
- `https://compute.aihack26.xyz/`
- `https://miner.aihack26.xyz/`
- `https://host.aihack26.xyz/`
- `https://drop.aihack26.xyz/`, `/api/sites`
- `https://drop.aihack26.xyz/p5-filler-demo/`
- `https://drop.aihack26.xyz/p5-kaleo-demo/`
- `https://drop.aihack26.xyz/p5-photographer-demo/`
- `https://x402.aihack26.xyz/`, `/.well-known/x402`
- `https://linktree.aihack26.xyz/`
- `https://swarm.aihack26.xyz/openclaw/`

Reliability burst test:
- 5 consecutive rounds across 8 primary public domains: all `200`.

## API/Contract Sanity
- `4002 /api/earnings`: expected keys present (`active_rentals`, `today_earnings`, `total_earnings_usdc`, `utilization_percent`)
- `4003 /api/status`: expected miner status keys present
- `4006 /api/stats`: expected aggregate stats keys present
- `4005 /api/sites`: reports `total_sites: 5` with expected paths

## Drop & Host Safety Tests
Negative-path validation:
- JS-only upload rejected: `{"error":"No valid files uploaded"}`
- Prompt-injection phrase rejected: `{"error":"Upload rejected by content safety checks"}`
- Path collision rejected: `{"error":"Path '/web101' already taken. Try another name."}`

Rate limiting:
- Repeated POST probe produced `429` with retry payload (`Rate limit exceeded` + `retry_after`)
- Verified reset after window expiration (returns non-429 once window clears)

Configured controls (from app config):
- Allowed upload extensions: `.html`, `.htm`
- Max upload body: 50 MB
- Prompt-injection scanning patterns enabled
- Per-IP rolling limiter enabled

## Gate Script Result
`00_SharedResources/recovery_gate.sh` result: **PASS**
- Local health checks: pass
- Log scan: pass (no critical patterns in service output logs)
- Drop-host tests: `5 passed`

## Log Findings
- Service output logs currently clean of critical traces.
- `cloudflared.log` includes historical `drop-host` origin connection-refused events around earlier instability windows; current checks are healthy and green.

## Project5 ZIP Integrity Audit (Systematic)
Hypothesis tested: media got mixed/lost during unzip/import.

Method:
- Compared each original ZIP `app/dist` file manifest vs deployed upload directory.

Result:
- `p5-filler-demo`: exact ZIP match
- `p5-kaleo-demo`: exact ZIP match
- `p5-photographer-demo`: exact ZIP match

Conclusion:
- No cross-zip file mixing during import.
- Confirmed content defect in source package: `p5-kaleo-demo` references `./footer-cabin.jpg`, but this file is missing both in deployed folder and in original ZIP.
- External confirmation: `https://drop.aihack26.xyz/p5-kaleo-demo/footer-cabin.jpg` returns `404`.

## Resource Snapshot
- Disk (`/`): 32% used
- Load averages observed: moderate during tests
- Memory pressure contributor at test time: browser/editor processes (Chrome, Codex renderer, Antigravity), not Project 4 Python services

## Risks and Caveats
1. Content defect: missing `footer-cabin.jpg` in Kaleo package (visual regression on that section).
2. Service supervision is manual (`screen` sessions), so crash recovery is not automatic.
3. Runtime state file `Project4-Unwise-Probbably/Sites/drop-host/uploads/deployments_index.json` is mutable and currently modified in working tree.
4. Static assets are served with cacheable headers (`max-age=14400`), so browser/CDN staleness can mask recent changes.

## Recommended Immediate Actions (Before "Prod" Claim)
1. Fix Kaleo missing asset:
   - provide actual `footer-cabin.jpg` in upload, or rebuild/export Kaleo package with complete dist assets.
2. Add simple service watchdog/restart policy for `4000-4007` + tunnel.
3. Decide whether deployment index should be repo-tracked; if not, move to untracked runtime-only state path.
4. Keep hard-refresh/cache-bust guidance in runbook for demo operators.

## Go/No-Go
- **GO for live demo now** with known Kaleo visual caveat.
- **NO-GO for strict production claim** until supervision and runtime-state handling are hardened.
