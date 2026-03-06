// popup.js - The Theatre UI Logic

// DOM Elements
const uis = {
    chatgpt: {
        fill: document.getElementById('fill-chatgpt'),
        val: document.getElementById('val-chatgpt'),
        prompts: document.getElementById('prompts-chatgpt')
    },
    claude: {
        fill: document.getElementById('fill-claude'),
        val: document.getElementById('val-claude'),
        prompts: document.getElementById('prompts-claude')
    },
    kimi: {
        fill: document.getElementById('fill-kimi'),
        val: document.getElementById('val-kimi'),
        prompts: document.getElementById('prompts-kimi')
    }
};

const tickerText = document.getElementById('ticker-text');
const gaugeCards = document.querySelectorAll('.gauge-card');

// Platform visibility
function applyPopupVisibility(settings) {
    gaugeCards.forEach(card => {
        const img = card.querySelector('.brand-logo');
        if (!img) return;
        const platform = img.alt.toLowerCase();
        card.style.display = settings[platform] !== false ? '' : 'none';
    });
}

// Theme management
function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('dark', 'peak', 'redlight');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'peak') root.classList.add('peak');
    else if (theme === 'redlight') root.classList.add('redlight');

    document.querySelectorAll('.theme-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.theme === theme);
    });
}

// Theme swatch clicks
document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const theme = swatch.dataset.theme;
        applyTheme(theme);
        chrome.storage.local.set({ uiTheme: theme });
    });
});

// Format numbers
const formatNum = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Animate values
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOut * (end - start) + start);
        obj.innerHTML = formatNum(current);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = formatNum(end);
    };
    window.requestAnimationFrame(step);
}

// Render data
function renderData(aiUsage, animate = false) {
    const limits = { chatgpt: 100000, claude: 100000, kimi: 100000 };

    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
        if (aiUsage[platform] && uis[platform]) {
            const data = aiUsage[platform];
            let percent = Math.max(5, Math.min(95, (data.estimatedTokens / limits[platform]) * 100));
            uis[platform].fill.style.setProperty('--fill-level', `${percent}%`);

            if (animate) {
                const currentTokens = parseInt(uis[platform].val.innerHTML.replace(/,/g, '')) || 0;
                const currentPrompts = parseInt(uis[platform].prompts.innerHTML.replace(/,/g, '')) || 0;
                animateValue(uis[platform].val, currentTokens, data.estimatedTokens, 1000);
                animateValue(uis[platform].prompts, currentPrompts, data.prompts, 1000);
            } else {
                uis[platform].val.innerHTML = formatNum(data.estimatedTokens);
                uis[platform].prompts.innerHTML = formatNum(data.prompts);
            }
        }
    });
}

// Initial Load
chrome.storage.local.get(['aiUsage', 'platformSettings', 'uiTheme'], (result) => {
    const settings = result.platformSettings || { claude: true, chatgpt: true, kimi: true };
    applyPopupVisibility(settings);
    applyTheme(result.uiTheme || 'light');
    if (result.aiUsage) renderData(result.aiUsage, false);
});

// Live Updates
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.platformSettings) applyPopupVisibility(changes.platformSettings.newValue);
        if (changes.uiTheme) applyTheme(changes.uiTheme.newValue);
        if (changes.aiUsage) {
            renderData(changes.aiUsage.newValue, true);
            tickerText.innerHTML = `DATA SYNC COMPLETE`;
            setTimeout(() => { tickerText.innerHTML = `MONITORING AI PLATFORMS • ONLINE`; }, 3000);
        }
    }
});

// Open Dashboard
document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

// Double-click header to sync Claude
document.querySelector('.ticker-header').addEventListener('dblclick', () => {
    tickerText.innerHTML = `SYNCING CLAUDE USAGE...`;
    chrome.runtime.sendMessage({ type: 'FORCE_SYNC_CLAUDE' });
});
