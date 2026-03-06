// dashboard.js — The Observatory Logic

const DEFAULT_SETTINGS = { claude: true, chatgpt: true, kimi: true, history: true, github: false };

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

document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const theme = swatch.dataset.theme;
        applyTheme(theme);
        chrome.storage.local.set({ uiTheme: theme });
    });
});

// DOM references
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

const totalPromptsEl = document.getElementById('total-prompts');
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

// Apply platform visibility across the dashboard
function applyVisibility(settings) {
    ['claude', 'chatgpt', 'kimi'].forEach(platform => {
        const enabled = settings[platform] !== false;
        // Gauge cards
        const gaugeCard = document.querySelector(`.gauge-big .gauge-logo[alt="${platform === 'chatgpt' ? 'ChatGPT' : platform === 'claude' ? 'Claude' : 'Kimi'}"]`);
        if (gaugeCard) gaugeCard.closest('.gauge-big').style.display = enabled ? '' : 'none';
        // Life sign rows
        const lifeIcon = document.querySelector(`.life-sign-row .platform-icon[alt="${platform === 'chatgpt' ? 'ChatGPT' : platform === 'claude' ? 'Claude' : 'Kimi'}"]`);
        if (lifeIcon) lifeIcon.closest('.life-sign-row').style.display = enabled ? '' : 'none';
    });
}

// Render data
function renderData(aiUsage, settings, animate = false) {
    const limits = { chatgpt: 100000, claude: 100000, kimi: 100000 };
    let totalP = 0, totalT = 0;

    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
        if (settings[platform] === false) return; // Skip disabled
        if (aiUsage[platform] && uis[platform]) {
            const data = aiUsage[platform];
            let pct = Math.max(5, Math.min(95, (data.estimatedTokens / limits[platform]) * 100));
            uis[platform].fill.style.setProperty('--fill-level', `${pct}%`);

            if (animate) {
                const curT = parseInt(uis[platform].val.innerHTML.replace(/,/g, '')) || 0;
                const curP = parseInt(uis[platform].prompts.innerHTML.replace(/,/g, '')) || 0;
                animateValue(uis[platform].val, curT, data.estimatedTokens, 1000);
                animateValue(uis[platform].prompts, curP, data.prompts, 1000);
            } else {
                uis[platform].val.innerHTML = formatNum(data.estimatedTokens);
                uis[platform].prompts.innerHTML = formatNum(data.prompts);
            }

            totalP += data.prompts;
            totalT += data.estimatedTokens;
        }
    });

    totalPromptsEl.innerHTML = formatNum(totalP);
    totalTokensEl.innerHTML = formatNum(totalT);
}

// Initial load
chrome.storage.local.get(['aiUsage', 'platformSettings', 'uiTheme'], (result) => {
    const settings = result.platformSettings || DEFAULT_SETTINGS;
    applyVisibility(settings);
    applyTheme(result.uiTheme || 'light');
    // Set toggle states from storage
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
        if (changes.uiTheme) applyTheme(changes.uiTheme.newValue);
        chrome.storage.local.get(['aiUsage', 'platformSettings'], (result) => {
            const settings = result.platformSettings || DEFAULT_SETTINGS;
            applyVisibility(settings);
            if (changes.aiUsage) renderData(changes.aiUsage.newValue, settings, true);
        });
    }
});

// Settings toggles — save to storage on change
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

// Generate heatmap cells (28 days)
const heatmapGrid = document.getElementById('heatmap');
for (let i = 0; i < 28; i++) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    const intensity = Math.random();
    if (intensity > 0.7) cell.style.background = `rgba(0, 240, 255, ${intensity * 0.6})`;
    else if (intensity > 0.4) cell.style.background = `rgba(0, 240, 255, 0.15)`;
    heatmapGrid.appendChild(cell);
}

// Pulse line animation
function drawPulse(canvasEl, color, speed) {
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width;
    const h = canvasEl.height;
    let offset = 0;

    function draw() {
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
        requestAnimationFrame(draw);
    }
    draw();
}

const canvases = document.querySelectorAll('.pulse-canvas');
const colors = ['#d97757', '#10a37f', '#6366f1'];
canvases.forEach((c, i) => drawPulse(c, colors[i], 1 + i * 0.5));
