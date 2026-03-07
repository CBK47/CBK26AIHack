# Sitrep Handover: Project 4 Deployment & Infrastructure

## Summary
The goal is to move the "Project 4" ecosystem (8 Python/Flask services) to be live on `aihack26.xyz` subdomains via Cloudflare Tunnels. Localhost is stable, but frontend assets and specific routing for `drop-host` and `freywill` need final polish.

## 🚀 Active Status
- **Tunnel:** `cloudflared` is running a unified tunnel (`aihack26-sites`) for all 8 ports.
- **Microservices:** Ports 4000-4007 are all active in the background on this Mac.
- **DNS:** Subdomains (swarm, freywill, compute, miner, host, drop-host, x402, linktree) are routed to the tunnel.

## 🛠 Work in Progress: "Advanced" Drop & Host
- **The Issue:** The previous version of `drop-host` (port 4005) was a "basic" port that was missing advanced UI features.
- **Ongoing Fix:** I am currently overwriting the `drop-host` frontend with the source found in: `/Users/cbk/Code/BroadShield/Example IT Rec Site Simple/-PROJECT-4-FREYWILL-AI-Services-Marketplace/drop-host`.
- **Next Step:** The `npm install && npm run build` process was started. You need to ensure the build completes and that the Flask app (`app.py`) correctly serves the `dist` folder.
- **Critical Caveat:** The user noted that `https://drop.aihack26.xyz/` might still have internal links pointing to `localhost`. These need to be updated to use relative paths or the production domain.

## ⚠️ Known Issues
1. **Freywill (Port 4001):** The root `/` route returns 404 because it can't find its `index.html`. It currently looks in `.` but the files might be in a different structure or need a build.
2. **Localhost Links:** The "Advanced" frontend being ported over likely contains hardcoded `http://localhost:4005` links in its React components. These need to be swept and updated to use the production subdomains.
3. **Start Script:** `start_all_sites.sh` is unreliable. I manually started the sites using `nohup python3 ... &`.

## 📍 Key Locations
- **Unified Config:** `/Users/cbk/Code/CBK26AIHack/Project4-Unwise-Probbably/Sites/tunnel_config.yml`
- **Drop-Host Site:** `/Users/cbk/Code/CBK26AIHack/Project4-Unwise-Probbably/Sites/drop-host`
- **Original Source (Advanced):** `/Users/cbk/Code/BroadShield/Example IT Rec Site Simple/-PROJECT-4-FREYWILL-AI-Services-Marketplace/drop-host`

## 📋 Recommended Next Steps
1. Verify `npm run build` finished in `Sites/drop-host/frontend`.
2. check `Sites/drop-host/app.py` is serving the `frontend/dist` directory.
3. Search and replace `localhost:4005` with `drop-host.aihack26.xyz` (or relative paths) in the `src` of the new frontend.
4. Locate the correct `index.html` for Freywill and fix the `send_from_directory` path in its `app.py`.
