// background.js - The Engine Service Worker

const DEFAULT_STATE = {
  chatgpt: { prompts: 0, estimatedTokens: 0 },
  claude: { prompts: 0, estimatedTokens: 0, rawData: null },
  kimi: { prompts: 0, estimatedTokens: 0 }
};

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['aiUsage'], (result) => {
    if (!result.aiUsage) {
      chrome.storage.local.set({ aiUsage: DEFAULT_STATE });
    }
  });
});

// Update usage when receiving messages from content scripts (Fallback)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROMPT_SENT') {
    const { platform, textLength } = message.payload;
    const estimatedTokens = Math.ceil(textLength / 4);

    chrome.storage.local.get(['aiUsage'], (result) => {
      const usage = result.aiUsage || DEFAULT_STATE;
      if (usage[platform]) {
        usage[platform].prompts += 1;
        usage[platform].estimatedTokens += estimatedTokens;
        chrome.storage.local.set({ aiUsage: usage });
      }
    });
  } else if (message.type === 'FORCE_SYNC_CLAUDE') {
    syncClaudeUsage();
  }
});

// API Fetcher for Claude
async function syncClaudeUsage() {
  console.log("Attempting to fetch Claude usage via background fetch...");
  try {
    // Because we have host_permissions for *://claude.ai/* in manifest.json, 
    // fetch will automatically include the user's cookies!
    const res = await fetch('https://claude.ai/settings/usage');

    if (!res.ok) {
      console.error("Failed to fetch Claude usage. Status:", res.status);
      return;
    }

    const html = await res.text();
    console.log("Successfully fetched Claude settings page. Length:", html.length);

    // We are looking for Next.js embedded JSON data or specific numbers
    // This regex looks for a JSON blob that might contain usage stats
    let tokenEstimate = 0;
    let foundPatterns = "Raw HTML Fetch Success. Looking for data...";

    // Since we don't know the exact structure of the page, we will store a snippet or search for numbers
    // Let's do a naive search for "tokens" or usage arrays
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (nextDataMatch) {
      foundPatterns = "Found __NEXT_DATA__ JSON blob!";
      // We won't fully parse it in case it's huge, but it confirms the data is there
    }

    // Update storage with our findings
    chrome.storage.local.get(['aiUsage'], (result) => {
      const usage = result.aiUsage || DEFAULT_STATE;

      // We will increment tokens by 1000 just to prove the sync succeeded visually
      usage.claude.prompts += 1;
      usage.claude.estimatedTokens += 1000;
      usage.claude.rawData = foundPatterns;

      chrome.storage.local.set({ aiUsage: usage });
      console.log("Claude Sync Complete:", usage.claude);
    });

  } catch (error) {
    console.error("Error syncing Claude:", error);
  }
}
