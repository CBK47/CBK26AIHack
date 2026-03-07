# Post-Crash Controlled Rollout Plan

Status: Active  
Owner: Codex (single-lane execution)  
Last updated: 2026-03-07

## Objective

Recover from unstable deployment edits, re-establish a predictable workflow, and migrate complex guest sites into Drop & Host with explicit safety gates and checkpoints.

## What likely went wrong

1. Runtime patching in `frontend/dist/index.html` introduced extra client-side logic without a strict gate.
2. Browser cache made stale/new JS behavior inconsistent during rapid iterations.
3. Drop & Host was configured to **serve only HTML**, so multi-file websites (JS/CSS/assets) partially loaded or appeared broken.
4. High local memory pressure from browser/app load amplified instability symptoms.

## Prevention controls (now required)

1. One-lane change policy:
   Only one active implementation lane at a time (`Codex`) for deployment-path changes.
2. Gate before each checkpoint:
   Run `00_SharedResources/recovery_gate.sh`.
3. Dist patch discipline:
   Changes to generated `frontend/dist/index.html` require explicit smoke-test and rollback path.
4. Cache discipline:
   Force hard refresh (`Cmd+Shift+R`) after frontend changes before judging stability.
5. Complex-site ingestion path:
   Use manual import script with index update and explicit verification.

## Step-by-step rollout

1. Baseline health and logs.
2. Apply minimal serving fix for multi-file site assets (keep uploads HTML-only).
3. Import one complex Project5 site manually.
4. Restart Drop & Host service and run gate script.
5. Document outcomes.
6. Commit and push checkpoint.
7. Repeat for remaining Project5 sites.
8. Re-test previously problematic paths and finalize docs.
9. Commit and push final stabilization checkpoint.

## Mechanical review gate (per step)

Run:

```bash
./00_SharedResources/recovery_gate.sh
```

Gate criteria:

1. All Project 4 local endpoints return HTTP 200.
2. `drop-host` API `/api/sites` returns HTTP 200.
3. No `Traceback|Exception|ERROR` patterns in recent service logs.
4. Drop-host test suite passes.
5. No new severe resource regression observed in top RSS snapshot.

## Rollback rule

If any gate fails:

1. Stop and mark step `on_hold` in `task_registry.md` with reason.
2. Revert only the last scoped change.
3. Re-run gate and proceed only on PASS.
