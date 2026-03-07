# PROJECT STATUS — Project 4 (FREYWILL) + Drop & Host Recovery

Last updated: 2026-03-07

## Current State

- Project 4 services on ports `4000-4007` are live and healthy.
- Cloudflare tunnel routes are returning HTTP 200 for all public subdomains.
- Drop & Host is stable after controlled recovery and repeated gate checks.

## Recovery Summary (Post-Crash)

### What was fixed

1. Added a controlled rollout runbook:
   - `00_SharedResources/recovery_controlled_rollout.md`
2. Added a mechanical health/test gate:
   - `00_SharedResources/recovery_gate.sh`
3. Fixed complex-site serving path in Drop & Host:
   - `Sites/drop-host/app.py` now serves static assets (JS/CSS/images/fonts) for deployed site folders.
   - Upload ingest remains HTML-only.
4. Added manual complex-site import tool:
   - `Sites/drop-host/import_project5_site.sh`

### Root causes addressed

- Dist-level frontend patching without gate checks.
- Browser caching confusion during rapid edits.
- HTML-only serving logic blocking bundled assets for complex sites.
- Process restart drift (orphan process) handled with explicit process reset.

## Port Map (Project 4)

- `4000` Swarm Command
- `4001` FREYWILL AI
- `4002` Compute Rental
- `4003` Auto-Miner
- `4004` Hackathon Hosting
- `4005` Drop & Host
- `4006` x402 Shared Pay
- `4007` Linktree
- `4008-4014` Reserved

## Project5 Complex Sites Imported into Drop & Host

Now live:

- `https://drop.aihack26.xyz/p5-filler-demo/`
- `https://drop.aihack26.xyz/p5-kaleo-demo/`
- `https://drop.aihack26.xyz/p5-photographer-demo/`

Existing upload examples still live:

- `https://drop.aihack26.xyz/web101/`
- `https://drop.aihack26.xyz/allowed-stack-test/`

## Validation Results

- Local endpoint checks: PASS for all `4000-4007`.
- Public endpoint checks: PASS for all project subdomains.
- Drop-host API `/api/sites`: PASS.
- Drop-host tests: `5 passed`.
- Multi-file site assets (JS/CSS/images) for all 3 Project5 imports: PASS locally and externally.

## Recommended Operating Pattern

1. Make one scoped change.
2. Run `./00_SharedResources/recovery_gate.sh`.
3. Verify public URL + critical assets.
4. Update docs/task registry.
5. Commit and push checkpoint.
