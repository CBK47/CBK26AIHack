// dashboard.js — The Observatory Logic

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

// Format numbers
const formatNum = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Animate values
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

// Render data
function renderData(aiUsage, animate = false) {
    const limits = { chatgpt: 100000, claude: 100000, kimi: 100000 };
    let totalP = 0, totalT = 0;

    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
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
chrome.storage.local.get(['aiUsage'], (result) => {
    if (result.aiUsage) renderData(result.aiUsage, false);
});

// Live updates
chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local' && changes.aiUsage) {
        renderData(changes.aiUsage.newValue, true);
    }
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
    // Random intensity for demo
    const intensity = Math.random();
    if (intensity > 0.7) cell.style.background = `rgba(0, 240, 255, ${intensity * 0.6})`;
    else if (intensity > 0.4) cell.style.background = `rgba(0, 240, 255, 0.15)`;
    heatmapGrid.appendChild(cell);
}

// Pulse line animation (simple sine wave on canvas)
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

// Start pulse animations
const canvases = document.querySelectorAll('.pulse-canvas');
const colors = ['#d97757', '#10a37f', '#6366f1'];
canvases.forEach((c, i) => drawPulse(c, colors[i], 1 + i * 0.5));
