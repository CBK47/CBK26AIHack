// dashboard.js — The Observatory Logic

const DEFAULT_SETTINGS = { claude: true, chatgpt: true, kimi: true, history: true, github: false };

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
    const selector = document.getElementById('color-selector');
    if (color && color !== 'blue') {
        document.documentElement.setAttribute('data-color', color);
    } else {
        document.documentElement.removeAttribute('data-color');
    }
    if (selector) selector.value = color || 'blue';
}

// Theme toggle click
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = !document.documentElement.hasAttribute('data-theme');
    applyTheme(isDark);
    chrome.storage.local.set({ uiDarkMode: isDark });
});

// Reload extension
document.getElementById('reload-extension').addEventListener('click', () => {
    chrome.runtime.reload();
});

// Color scheme change
document.getElementById('color-selector').addEventListener('change', (e) => {
    const color = e.target.value;
    applyColorScheme(color);
    chrome.storage.local.set({ uiColorScheme: color });
});

// DOM references
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

const totalTokensEl = document.getElementById('total-tokens');

const formatNum = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function animateValue(el, start, end, duration) {
    let startTs = null;
    const step = (ts) => {
        if (!startTs) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        el.innerHTML = formatNum(Math.floor(easeOut * (end - start) + start));
        if (progress < 1) requestAnimationFrame(step);
        else el.innerHTML = formatNum(end);
    };
    requestAnimationFrame(step);
}

// Apply platform visibility
function applyVisibility(settings) {
    ['claude', 'chatgpt', 'kimi'].forEach(platform => {
        const enabled = settings[platform] !== false;
        const alt = platform === 'chatgpt' ? 'ChatGPT' : platform === 'claude' ? 'Claude' : 'Kimi';
        const gaugeCard = document.querySelector(`.gauge-big .gauge-logo[alt="${alt}"]`);
        if (gaugeCard) gaugeCard.closest('.gauge-big').style.display = enabled ? '' : 'none';
        const lifeIcon = document.querySelector(`.life-sign-row .platform-icon[alt="${alt}"]`);
        if (lifeIcon) lifeIcon.closest('.life-sign-row').style.display = enabled ? '' : 'none';
    });
}

// Render data
function renderData(aiUsage, settings, animate = false) {
    const fallbackLimits = { chatgpt: 100000, claude: 100000, kimi: 100000 };
    let totalT = 0;

    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
        if (settings[platform] === false) return;
        if (aiUsage[platform] && uis[platform]) {
            const data = aiUsage[platform];
            const tokenLimit = Number.isFinite(data.tokenLimit) && data.tokenLimit > 0
                ? data.tokenLimit
                : fallbackLimits[platform];
            let pct = Math.max(5, Math.min(95, (data.estimatedTokens / tokenLimit) * 100));
            uis[platform].fill.style.setProperty('--fill-level', `${pct}%`);
            uis[platform].limit.innerHTML = formatNum(tokenLimit);

            if (animate) {
                const curT = parseInt(uis[platform].val.innerHTML.replace(/,/g, '')) || 0;
                animateValue(uis[platform].val, curT, data.estimatedTokens, 1000);
            } else {
                uis[platform].val.innerHTML = formatNum(data.estimatedTokens);
            }

            totalT += data.estimatedTokens;
        }
    });

    totalTokensEl.innerHTML = formatNum(totalT);
}

// Initial load
chrome.storage.local.get(['aiUsage', 'platformSettings', 'uiDarkMode', 'uiColorScheme'], (result) => {
    const settings = result.platformSettings || DEFAULT_SETTINGS;
    applyVisibility(settings);
    applyTheme(result.uiDarkMode || false);
    applyColorScheme(result.uiColorScheme || 'blue');

    document.querySelectorAll('.toggle-input[data-platform]').forEach(toggle => {
        toggle.checked = settings[toggle.dataset.platform] !== false;
    });
    document.querySelectorAll('.toggle-input[data-feature]').forEach(toggle => {
        toggle.checked = settings[toggle.dataset.feature] !== false;
    });
    if (result.aiUsage) renderData(result.aiUsage, settings, false);
});

// Live updates
chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local') {
        if (changes.uiDarkMode) applyTheme(changes.uiDarkMode.newValue);
        if (changes.uiColorScheme) applyColorScheme(changes.uiColorScheme.newValue);
        chrome.storage.local.get(['aiUsage', 'platformSettings'], (result) => {
            const settings = result.platformSettings || DEFAULT_SETTINGS;
            applyVisibility(settings);
            if (changes.aiUsage) renderData(changes.aiUsage.newValue, settings, true);
        });
    }
});

// Settings toggles
document.querySelectorAll('.toggle-input').forEach(toggle => {
    toggle.addEventListener('change', () => {
        chrome.storage.local.get(['platformSettings'], (result) => {
            const settings = result.platformSettings || { ...DEFAULT_SETTINGS };
            const key = toggle.dataset.platform || toggle.dataset.feature;
            settings[key] = toggle.checked;
            chrome.storage.local.set({ platformSettings: settings });
            applyVisibility(settings);
        });
    });
});

// Tab navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('tab-overview').classList.toggle('hidden', tab !== 'overview');
        document.getElementById('tab-settings').classList.toggle('hidden', tab !== 'settings');
    });
});

// Generate heatmap
const heatmapGrid = document.getElementById('heatmap');
for (let i = 0; i < 28; i++) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    const intensity = Math.random();
    if (intensity > 0.7) cell.style.background = `var(--accent-hover)`;
    else if (intensity > 0.4) cell.style.background = `var(--accent-soft)`;
    heatmapGrid.appendChild(cell);
}

// Pulse line animation
function drawPulse(canvasEl, color, speed) {
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width;
    const h = canvasEl.height;
    let offset = 0;
    let rafId = null;
    let running = false;

    function drawFrame() {
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;

        for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin((x + offset) * 0.05) * 12 + Math.sin((x + offset) * 0.12) * 4;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += speed;
        if (running) {
            rafId = requestAnimationFrame(drawFrame);
        }
    }

    return {
        start() {
            if (running) return;
            running = true;
            drawFrame();
        },
        stop() {
            running = false;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    };
}

const canvases = document.querySelectorAll('.pulse-canvas');
const colors = ['#d97757', '#10a37f', '#6366f1'];
const pulseControllers = Array.from(canvases).map((c, i) => drawPulse(c, colors[i], 1 + i * 0.5));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function shouldAnimatePulse() {
    const overviewVisible = !document.getElementById('tab-overview').classList.contains('hidden');
    return !document.hidden && !reducedMotion.matches && overviewVisible;
}

function updatePulseAnimationState() {
    const active = shouldAnimatePulse();
    pulseControllers.forEach((controller) => {
        if (active) controller.start();
        else controller.stop();
    });
}

document.addEventListener('visibilitychange', updatePulseAnimationState);
if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', updatePulseAnimationState);
}

const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        updatePulseAnimationState();
    });
});

updatePulseAnimationState();
