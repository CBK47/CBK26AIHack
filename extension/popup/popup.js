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
const costVal = document.getElementById('val-cost');

// Helper to format numbers with commas
const formatNum = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// FLIP-like animation for numbers (Counting up smoothly)
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easing out quart
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOut * (end - start) + start);
        obj.innerHTML = formatNum(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = formatNum(end);
        }
    };
    window.requestAnimationFrame(step);
}

// Update UI based on data
function renderData(aiUsage, animate = false) {
    let totalCost = 0;

    // Cost estimates (totally made up for POC, using rough token ratios)
    const rates = { chatgpt: 0.0002, claude: 0.0003, kimi: 0.0001 };
    const limits = { chatgpt: 100000, claude: 100000, kimi: 100000 }; // tokens capacity per visual tank

    // Update each platform
    ['chatgpt', 'claude', 'kimi'].forEach(platform => {
        if (aiUsage[platform] && uis[platform]) {
            const data = aiUsage[platform];

            // Calculate fill percentage (clamp to 5% - 95% for visual reasons)
            let percent = (data.estimatedTokens / limits[platform]) * 100;
            percent = Math.max(5, Math.min(95, percent));

            // Update DOM
            uis[platform].fill.style.setProperty('--fill-level', `${percent}%`);

            // Animate numbers
            if (animate) {
                const currentTokens = parseInt(uis[platform].val.innerHTML.replace(/,/g, '')) || 0;
                const currentPrompts = parseInt(uis[platform].prompts.innerHTML.replace(/,/g, '')) || 0;

                animateValue(uis[platform].val, currentTokens, data.estimatedTokens, 1000);
                animateValue(uis[platform].prompts, currentPrompts, data.prompts, 1000);

                // Add momentary 'hiccup' class for visual feedback
                uis[platform].fill.parentElement.parentElement.classList.add('hiccup');
                setTimeout(() => uis[platform].fill.parentElement.parentElement.classList.remove('hiccup'), 300);
            } else {
                uis[platform].val.innerHTML = formatNum(data.estimatedTokens);
                uis[platform].prompts.innerHTML = formatNum(data.prompts);
            }

            totalCost += data.estimatedTokens * rates[platform];
        }
    });

    // Update cost
    const currentCost = parseFloat(costVal.innerHTML) || 0;
    if (animate) {
        // simpler float ticker
        costVal.innerHTML = totalCost.toFixed(2);
    } else {
        costVal.innerHTML = totalCost.toFixed(2);
    }
}

// Initial Load
chrome.storage.local.get(['aiUsage'], (result) => {
    if (result.aiUsage) {
        renderData(result.aiUsage, false);
    }
});

// Live Updates
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.aiUsage) {
        renderData(changes.aiUsage.newValue, true);

        // Update ticker
        tickerText.innerHTML = `NEW TELEMETRY • DATA SYNC COMPLETE • LOCAL MODE`;
        setTimeout(() => {
            tickerText.innerHTML = `MONITORING ACTIVITY • ONLINE`;
        }, 3000);
    }
});

// Add CSS for hiccup animation dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes hiccup {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); border-color: var(--accent-cyan); }
    100% { transform: scale(1); }
  }
  .gauge-card.hiccup {
    animation: hiccup 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`;
document.head.appendChild(style);
