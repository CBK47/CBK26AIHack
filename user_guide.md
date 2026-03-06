# AI Mission Control POC - User Guide

Welcome to the AI Mission Control Proof of Concept (POC)! This extension transforms your AI usage tracking into a cinematic data visualization experience.

## Installation Instructions

1. **Open Extensions in Chrome**: Open Google Chrome and navigate to `chrome://extensions/`.
2. **Enable Developer Mode**: In the top right corner of the Extensions page, toggle "Developer mode" to **ON**.
3. **Load Unpacked**: Click the **Load unpacked** button in the top left.
4. **Select the Folder**: Navigate to the provided project directory and select the `extension` folder (e.g., `/Users/cbk/Code/CBK26AIHack/extension`).
5. **Pin the Extension**: For easy access, click the puzzle piece icon next to your URL bar and click the pin icon next to "AI Mission Control".

## How to Test the POC

The POC currently monitors prompts sent on ChatGPT, Claude, and Kimi.

1. **Open The Theatre (Popup)**: Click the **AI Mission Control icon** in your toolbar. You will see the Cyber-Luxury minimalist UI, complete with 3 liquid gauges representing ChatGPT, Claude, and Kimi usages.
2. **Generate Telemetry Data**: 
   - Open a new tab and go to [chatgpt.com](https://chatgpt.com), [claude.ai](https://claude.ai), or [kimi.moonshot.cn](https://kimi.moonshot.cn).
   - Type a prompt and hit **Enter** (or click the send button).
3. **Watch the Magic**: 
   - Open the extension popup again to see the data update! 
   - The relevant gauge's liquid fill level will rise.
   - The token counter and prompt count will animate upwards smoothly.
   - The total estimated cost in the footer will automatically tick upwards.

*Note: For this POC, token counts are rough estimations based on character lengths, and costs are simulated based on these estimations.*
