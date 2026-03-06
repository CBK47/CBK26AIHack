// content.js - Injected into AI chat interfaces

console.log("AI Mission Control: Content Script Injected");

// Identify the platform based on the hostname
let platform = 'unknown';
const hostname = window.location.hostname;
if (hostname.includes('chatgpt.com')) platform = 'chatgpt';
else if (hostname.includes('claude.ai')) platform = 'claude';
else if (hostname.includes('kimi.moonshot.cn') || hostname.includes('www.kimi.com')) platform = 'kimi';

if (platform === 'unknown') {
    console.warn('AI Mission Control: unknown platform host, tracker disabled for this page');
}

const composerSelectors = [
    'textarea',
    '[contenteditable="true"]',
    '[role="textbox"]'
];

let lastKnownInputText = '';
let lastSubmission = { signature: '', at: 0 };

function readElementText(el) {
    if (!el) return '';
    if (typeof el.value === 'string') return el.value;
    return el.innerText || el.textContent || '';
}

function findActiveComposer(fromTarget) {
    if (fromTarget && (fromTarget.tagName === 'TEXTAREA' || fromTarget.isContentEditable || fromTarget.getAttribute('role') === 'textbox')) {
        return fromTarget;
    }

    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable || active.getAttribute('role') === 'textbox')) {
        return active;
    }

    return document.querySelector(composerSelectors.join(', '));
}

function isLikelySendButton(button) {
    if (!button) return false;
    const attrs = [
        button.getAttribute('aria-label') || '',
        button.getAttribute('title') || '',
        button.getAttribute('data-testid') || '',
        button.getAttribute('name') || '',
        button.getAttribute('id') || '',
        button.textContent || ''
    ].join(' ').toLowerCase();

    const explicitSubmit = (button.getAttribute('type') || '').toLowerCase() === 'submit';
    const hasSendKeyword = /(send|submit|enter|arrow-up|paper-plane)/.test(attrs);
    return explicitSubmit || hasSendKeyword;
}

function shouldDedupe(signature) {
    const now = Date.now();
    if (lastSubmission.signature === signature && (now - lastSubmission.at) < 1500) {
        return true;
    }
    lastSubmission = { signature, at: now };
    return false;
}

function recordPromptAndSend(text) {
    if (platform === 'unknown') return;
    const trimmedText = (text || '').trim();
    if (trimmedText.length === 0) return;

    const signature = `${platform}:${trimmedText.length}:${trimmedText.slice(0, 80)}`;
    if (shouldDedupe(signature)) return;

    console.log(`AI Mission Control: Detected prompt submission on ${platform}. Length: ${trimmedText.length}`);
    chrome.runtime.sendMessage({
        type: 'PROMPT_SENT',
        payload: {
            platform,
            textLength: trimmedText.length
        }
    });
}

document.addEventListener('input', (e) => {
    const composer = findActiveComposer(e.target);
    if (!composer) return;
    lastKnownInputText = readElementText(composer);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    const composer = findActiveComposer(e.target);
    if (!composer) return;
    setTimeout(() => {
        const text = lastKnownInputText || readElementText(composer);
        recordPromptAndSend(text);
        lastKnownInputText = '';
    }, 0);
});

document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!isLikelySendButton(button)) return;

    const composer = findActiveComposer(button);
    const text = lastKnownInputText || readElementText(composer);
    recordPromptAndSend(text);
    lastKnownInputText = '';
});
