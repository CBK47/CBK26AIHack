// popup.js - The Theatre UI Logic

// DOM Elements
const uis = {
    chatgpt: {
        fill: document.getElementById('fill-chatgpt'),
        val: document.getElementById('val-chatgpt'),
        limit: document.getElementById('limit-chatgpt')
    },
    claude: {
        fill: document.getElementById('fill-claude'),
        val: document.getElementById('val-claude'),
        limit: document.getElementById('limit-claude')
    },
    kimi: {
        fill: document.getElementById('fill-kimi'),
        val: document.getElementById('val-kimi'),
        limit: document.getElementById('limit-kimi')
    }
};

const tickerText = document.getElementById('ticker-text');
const gaugeCards = document.querySelectorAll('.gauge-card');
const themeToggle = document.getElementById('theme-toggle');
const colorSelector = document.getElementById('color-selector');

// Platform visibility
function applyPopupVisibility(settings) {
    gaugeCards.forEach(card => {
        const img = card.querySelector('.brand-logo');
        if (!img) return;
        const platform = img.alt.toLowerCase();
        card.style.display = settings[platform] !== false ? '' : 'none';
    });
}

// Theme: light/dark via data-theme attribute
function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Color scheme via data-color attribute
function applyColorScheme(color) {
    if (color && color !== 'blue') {
        document.documentElement.setAttribute('data-color', color);
    } else {
        document.documentElement.removeAttribute('data-color');
    }
    colorSelector.value = color || 'blue';
}

// Theme toggle click
themeToggle.addEventListener('click', () => {
    const isDark = !document.documentElement.hasAttribute('data-theme');
    applyTheme(isDark);
    chrome.storage.local.set({ uiDarkMode: isDark });
});

// Color scheme change
colorSelector.addEventListener('change', () => {
    const color = colorSelector.value;
    applyColorScheme(color);
    chrome.storage.local.set({ uiColorScheme: color });
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
    const fallbackLimits = { chatgpt: 100000, claude: 100000, kimi: 100000 };

    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
        if (aiUsage[platform] && uis[platform]) {
            const data = aiUsage[platform];
            const tokenLimit = Number.isFinite(data.tokenLimit) && data.tokenLimit > 0
                ? data.tokenLimit
                : fallbackLimits[platform];
            let percent = Math.max(5, Math.min(95, (data.estimatedTokens / tokenLimit) * 100));
            uis[platform].fill.style.setProperty('--fill-level', `${percent}%`);
            uis[platform].limit.innerHTML = formatNum(tokenLimit);

            if (animate) {
                const currentTokens = parseInt(uis[platform].val.innerHTML.replace(/,/g, '')) || 0;
                animateValue(uis[platform].val, currentTokens, data.estimatedTokens, 1000);
            } else {
                uis[platform].val.innerHTML = formatNum(data.estimatedTokens);
            }
        }
    });
}

// Initial Load
chrome.storage.local.get(['aiUsage', 'platformSettings', 'uiDarkMode', 'uiColorScheme'], (result) => {
    const settings = result.platformSettings || { claude: true, chatgpt: true, kimi: true };
    applyPopupVisibility(settings);
    applyTheme(result.uiDarkMode || false);
    applyColorScheme(result.uiColorScheme || 'blue');
    if (result.aiUsage) renderData(result.aiUsage, false);
});

// Live Updates
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.platformSettings) applyPopupVisibility(changes.platformSettings.newValue);
        if (changes.uiDarkMode) applyTheme(changes.uiDarkMode.newValue);
        if (changes.uiColorScheme) applyColorScheme(changes.uiColorScheme.newValue);
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
