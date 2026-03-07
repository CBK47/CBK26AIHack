# Handover: Project 4 Stabilization + Project5 Site Imports

Last updated: 2026-03-07

## Scope Completed

1. Built a controlled recovery process with explicit gates.
2. Stabilized Drop & Host for complex static websites.
3. Imported and verified 3 Project5 complex websites into public hosting.

## Key Files Changed

- `00_SharedResources/recovery_controlled_rollout.md`
- `00_SharedResources/recovery_gate.sh`
- `00_SharedResources/task_registry.md`
- `Project4-Unwise-Probbably/PROJECT_STATUS.md`
- `Project4-Unwise-Probbably/Sites/drop-host/app.py`
- `Project4-Unwise-Probbably/Sites/drop-host/import_project5_site.sh`
- `Project4-Unwise-Probbably/Sites/drop-host/uploads/deployments_index.json`
- `Project4-Unwise-Probbably/Sites/drop-host/uploads/p5-filler-demo/*`
- `Project4-Unwise-Probbably/Sites/drop-host/uploads/p5-kaleo-demo/*`
- `Project4-Unwise-Probbably/Sites/drop-host/uploads/p5-photographer-demo/*`

## Live URLs Verified

- `https://drop.aihack26.xyz/p5-filler-demo/`
- `https://drop.aihack26.xyz/p5-kaleo-demo/`
- `https://drop.aihack26.xyz/p5-photographer-demo/`
- `https://drop.aihack26.xyz/web101/`
- `https://drop.aihack26.xyz/allowed-stack-test/`

## Service Runtime Notes

- Project 4 services are active on ports `4000-4007`.
- Drop-host process may survive detached-screen shutdown in orphaned state.
- Reliable restart method for drop-host:

```bash
pkill -f '/Sites/drop-host.*python3 app.py' || true
screen -dmS p4-4005 bash -lc 'cd /Users/cbk/Code/CBK26AIHack/Project4-Unwise-Probbably/Sites/drop-host && /Users/cbk/.pyenv/versions/3.13.12/bin/python3 app.py > output.log 2>&1'
```

## Operational Gate

Run before/after deployment-path edits:

```bash
cd /Users/cbk/Code/CBK26AIHack
./00_SharedResources/recovery_gate.sh
```

Expected: `GATE RESULT: PASS`

## Follow-up Suggestions

1. Add file lock around `deployments_index.json` writes to avoid concurrent import/deploy race.
2. Add an admin-only `/api/reload` endpoint to refresh index without process restart.
3. Consider a small managed allowlist for uploadable static asset types (if HTML-only policy is loosened later).
