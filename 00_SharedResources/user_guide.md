# AI Mission Control POC - User Guide

This guide covers local installation and testing for Project 1.

## Install (Developer Mode)

1. Open `chrome://extensions/` in Chrome.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select: `/Users/cbk/Code/CBK26AIHack/Project1_MissionControl/extension`
5. Pin the extension in the Chrome toolbar.

## Basic Test Flow

1. Open the extension popup.
2. Visit one of:
   - `https://chatgpt.com`
   - `https://claude.ai`
   - `https://kimi.moonshot.cn`
3. Send a prompt on one platform.
4. Reopen popup and confirm gauge + token estimate changed.

Note: Current token values are heuristic estimates, not guaranteed provider-reported totals.
