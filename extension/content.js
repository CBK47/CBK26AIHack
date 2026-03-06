// content.js - Injected into AI chat interfaces

console.log("AI Mission Control: Content Script Injected");

// Identify the platform based on the hostname
let platform = 'unknown';
const hostname = window.location.hostname;
if (hostname.includes('chatgpt.com')) platform = 'chatgpt';
else if (hostname.includes('claude.ai')) platform = 'claude';
else if (hostname.includes('kimi.moonshot.cn')) platform = 'kimi';

// For the POC, we'll use a simple heuristic:
// Listen for 'Enter' keydowns on textareas or editable divs, and button clicks
// Note: This is a basic implementation and might need refinement for each specific platform's DOM structure.

let lastPromptText = '';

// Capture text as user types
document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
        lastPromptText = target.value || target.innerText || '';
    }
});

// Detect submission via Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target;
        // Check if it's likely a chat input
        if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Small delay to ensure text wasn't cleared by default behavior before we grabbed it
            setTimeout(() => recordPromptAndSend(lastPromptText), 10);
            lastPromptText = ''; // Reset
        }
    }
});

// Detect submission via button click (heuristic: buttons with aria-label containing 'send' or similar svg icons)
document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (target) {
        // Basic check for send buttons - very platform dependent in reality, but good enough for POC
        const isSendButton = target.getAttribute('aria-label')?.toLowerCase().includes('send') ||
            target.innerHTML.includes('send') ||
            target.querySelector('svg');

        if (isSendButton && lastPromptText.trim().length > 0) {
            recordPromptAndSend(lastPromptText);
            lastPromptText = ''; // Reset
        }
    }
});

function recordPromptAndSend(text) {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) return;

    console.log(`AI Mission Control: Detected prompt submission on ${platform}. Length: ${trimmedText.length}`);

    chrome.runtime.sendMessage({
        type: 'PROMPT_SENT',
        payload: {
            platform: platform,
            textLength: trimmedText.length
        }
    });
}
