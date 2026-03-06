// background.js - The Engine Service Worker

const PLATFORMS = ['chatgpt', 'claude', 'kimi'];
const DEFAULT_TOKEN_LIMITS = {
  chatgpt: 100000,
  claude: 100000,
  kimi: 100000
};

function createPlatformUsage(platform) {
  return {
    estimatedTokens: 0,
    tokenLimit: DEFAULT_TOKEN_LIMITS[platform],
    rawData: null,
    lastSyncAt: null
  };
}

function defaultState() {
  return {
    chatgpt: createPlatformUsage('chatgpt'),
    claude: createPlatformUsage('claude'),
    kimi: createPlatformUsage('kimi')
  };
}

function normalizeUsageState(raw) {
  const base = defaultState();
  const output = {};

  PLATFORMS.forEach((platform) => {
    const source = raw && raw[platform] ? raw[platform] : {};
    output[platform] = {
      ...base[platform],
      ...source
    };

    if (!Number.isFinite(output[platform].estimatedTokens) || output[platform].estimatedTokens < 0) {
      output[platform].estimatedTokens = 0;
    }
    if (!Number.isFinite(output[platform].tokenLimit) || output[platform].tokenLimit <= 0) {
      output[platform].tokenLimit = DEFAULT_TOKEN_LIMITS[platform];
    }
  });

  return output;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['aiUsage'], (result) => {
    chrome.storage.local.set({ aiUsage: normalizeUsageState(result.aiUsage) });
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PROMPT_SENT') {
    const { platform, textLength } = message.payload || {};
    if (!PLATFORMS.includes(platform) || !Number.isFinite(textLength) || textLength <= 0) return;

    const estimatedTokens = Math.ceil(textLength / 4);
    chrome.storage.local.get(['aiUsage'], (result) => {
      const usage = normalizeUsageState(result.aiUsage);
      usage[platform].estimatedTokens += estimatedTokens;
      chrome.storage.local.set({ aiUsage: usage });
    });
  } else if (message.type === 'FORCE_SYNC_CLAUDE') {
    syncClaudeUsage();
  }
});

function isNumeric(value) {
  return Number.isFinite(value) && value >= 0;
}

function extractTokenCandidate(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const usedKeys = [
    'used',
    'usage',
    'consumed',
    'current',
    'tokens_used',
    'token_usage',
    'total_tokens',
    'input_tokens',
    'output_tokens'
  ];
  const limitKeys = ['limit', 'max', 'quota', 'allowance', 'cap', 'token_limit'];
  const remainingKeys = ['remaining', 'tokens_remaining'];

  let used = null;
  let limit = null;
  let remaining = null;

  Object.keys(obj).forEach((key) => {
    const lower = key.toLowerCase();
    const value = obj[key];

    if (!isNumeric(value)) return;

    if (usedKeys.some((k) => lower.includes(k))) used = value;
    if (limitKeys.some((k) => lower.includes(k))) limit = value;
    if (remainingKeys.some((k) => lower.includes(k))) remaining = value;
  });

  if (used === null && limit !== null && remaining !== null && remaining <= limit) {
    used = Math.max(limit - remaining, 0);
  }

  if (used === null && limit === null) return null;

  return {
    used: used !== null ? used : null,
    limit: limit !== null ? limit : null
  };
}

function findClaudeTokenStats(root) {
  const queue = [root];
  let best = null;

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== 'object') continue;

    const candidate = extractTokenCandidate(node);
    if (candidate && (candidate.used !== null || candidate.limit !== null)) {
      const score = (candidate.used !== null ? 1 : 0) + (candidate.limit !== null ? 1 : 0);
      if (!best || score > best.score) {
        best = { ...candidate, score };
        if (score === 2) break;
      }
    }

    if (Array.isArray(node)) {
      node.forEach((item) => queue.push(item));
    } else {
      Object.values(node).forEach((value) => queue.push(value));
    }
  }

  return best ? { used: best.used, limit: best.limit } : null;
}

function parseClaudeUsagePercentagesFromHtml(html) {
  const parsePercent = (matchValue) => {
    const value = Number.parseInt(matchValue, 10);
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, value));
  };

  const sessionMatch = html.match(/Current session[\s\S]{0,500}?(\d{1,3})%\s*used/i);
  const weeklyMatch = html.match(/Weekly limits[\s\S]{0,1200}?All models[\s\S]{0,1200}?(\d{1,3})%\s*used/i);
  const genericMatches = [...html.matchAll(/(\d{1,3})%\s*used/gi)];

  const sessionPercent = sessionMatch ? parsePercent(sessionMatch[1]) : null;
  const weeklyPercent = weeklyMatch ? parsePercent(weeklyMatch[1]) : null;

  let fallbackPercent = null;
  if (genericMatches.length > 0) {
    const values = genericMatches
      .map((m) => parsePercent(m[1]))
      .filter((v) => v !== null);
    if (values.length > 0) {
      fallbackPercent = Math.max(...values);
    }
  }

  return {
    sessionPercent,
    weeklyPercent,
    fallbackPercent
  };
}

async function syncClaudeUsage() {
  console.log('Claude sync: fetching settings usage page');
  try {
    const res = await fetch('https://claude.ai/settings/usage');
    if (!res.ok) {
      console.error('Claude sync failed with status:', res.status);
      return;
    }

    const html = await res.text();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    let parsedStats = null;
    const percentStats = parseClaudeUsagePercentagesFromHtml(html);
    let syncNote = 'Claude sync fetched HTML but no __NEXT_DATA__ blob found.';

    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        parsedStats = findClaudeTokenStats(nextData);
        if (parsedStats) {
          syncNote = 'Claude sync parsed token usage from __NEXT_DATA__.';
        } else {
          syncNote = 'Claude sync found __NEXT_DATA__, but no token fields matched parser heuristics.';
        }
      } catch (parseError) {
        console.error('Claude sync JSON parse failed:', parseError);
        syncNote = 'Claude sync found __NEXT_DATA__, but parsing failed.';
      }
    }

    chrome.storage.local.get(['aiUsage'], (result) => {
      const usage = normalizeUsageState(result.aiUsage);
      let updatedFromPercentFallback = false;

      if (parsedStats?.used !== null && isNumeric(parsedStats.used)) {
        usage.claude.estimatedTokens = parsedStats.used;
      }
      if (parsedStats?.limit !== null && isNumeric(parsedStats.limit) && parsedStats.limit > 0) {
        usage.claude.tokenLimit = parsedStats.limit;
      }

      if (!parsedStats?.used && !parsedStats?.limit) {
        const bestPercent = percentStats.weeklyPercent ?? percentStats.sessionPercent ?? percentStats.fallbackPercent;
        if (Number.isFinite(bestPercent)) {
          const effectiveLimit = usage.claude.tokenLimit || DEFAULT_TOKEN_LIMITS.claude;
          usage.claude.estimatedTokens = Math.round((bestPercent / 100) * effectiveLimit);
          updatedFromPercentFallback = true;
        }
      }

      if (updatedFromPercentFallback) {
        syncNote = `Claude sync used usage-page percentage fallback (weekly=${percentStats.weeklyPercent ?? 'n/a'}%, session=${percentStats.sessionPercent ?? 'n/a'}%).`;
      }

      usage.claude.rawData = syncNote;
      usage.claude.lastSyncAt = new Date().toISOString();
      chrome.storage.local.set({ aiUsage: usage });
      console.log('Claude sync complete:', usage.claude);
    });
  } catch (error) {
    console.error('Error syncing Claude usage:', error);
  }
}
