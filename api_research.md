# API Extraction Research

To pull historical/weekly usage data instead of just tracking live keystrokes, the extension needs to leverage the user's active session cookies to query the internal APIs of ChatGPT, Claude, and Kimi natively from the background script.

## ChatGPT (`chatgpt.com`)
- **Conversation History:** `https://chatgpt.com/backend-api/conversations?offset=0&limit=50`
- **Method:** `fetch()` from background script, passing `credentials: 'include'`.
- **Parsing:** Sum up the lengths of all messages in recent conversations to estimate historical usage. (Note: ChatGPT does not expose raw token counts easily via the web API, so we still estimate based on characters/words in the history).

## Claude (`claude.ai`)
- **Organization Info (Usage):** `https://api.claude.ai/api/organizations` -> getting the `uuid`, then `https://api.claude.ai/api/organizations/{uuid}/chat_conversations`
- **Method:** Requires capturing headers (e.g., `Cookie` or `sessionKey`) which might be more strictly protected than ChatGPT. Can use `chrome.cookies.get` or `chrome.webRequest` to sniff the auth token, or just `fetch` from a content script running on `claude.ai`.

## Kimi (`kimi.moonshot.cn`)
- **Conversation List:** Usually an endpoint like `https://kimi.moonshot.cn/api/chat/conversations` (needs verification).
- **Method:** Similar to others, requires active auth token.

## Technical Approach (Manifest V3)
1. **Background Service Worker (`background.js`)** must have `host_permissions` for all three domains (already done).
2. Use `chrome.cookies.getAll` or `fetch()` directly from the background script (since Chrome extensions bypass CORS for hosts in `host_permissions`).
3. If background `fetch()` fails due to missing anti-bot headers (like `x-csrf-token`), we can **inject a specialized content script** as an invisible iframe or run queries directly on the page and pass the JSON back to the background worker.

## The Challenge
Directly polling these APIs can lead to the user getting rate-limited or logged out if we poll too aggressively. We must cache the weekly data and only update it occasionally (e.g., once an hour or on extension popup open).
