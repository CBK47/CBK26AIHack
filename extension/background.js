// background.js - The Engine Service Worker

const DEFAULT_STATE = {
  chatgpt: { prompts: 0, estimatedTokens: 0 },
  claude: { prompts: 0, estimatedTokens: 0 },
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

// Update usage when receiving messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROMPT_SENT') {
    const { platform, textLength } = message.payload;
    const estimatedTokens = Math.ceil(textLength / 4); // Rough approximation

    chrome.storage.local.get(['aiUsage'], (result) => {
      const usage = result.aiUsage || DEFAULT_STATE;
      
      // Update the platform stats
      if (usage[platform]) {
        usage[platform].prompts += 1;
        usage[platform].estimatedTokens += estimatedTokens;
        
        // Save back to storage
        chrome.storage.local.set({ aiUsage: usage });
        console.log(`Updated ${platform} usage:`, usage[platform]);
      }
    });
  }
});
