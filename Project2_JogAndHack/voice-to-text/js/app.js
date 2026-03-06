/**
 * Whisper VTT — Browser UI
 * Records audio via MediaRecorder, sends to local Whisper server, displays transcript.
 */

const API_URL = window.location.origin;

// --- State ---
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStart = 0;
let timerInterval = null;
let audioContext = null;
let analyser = null;
let animFrame = null;
let processingStart = 0;
let processingInterval = null;
let isBusy = false;

// --- DOM ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// --- Boot Sequence ---
async function boot() {
  const bootText = $('#bootText');
  const bootFill = $('.boot-bar-fill');
  let progress = 0;

  const setProgress = (pct, msg) => {
    progress = Math.min(pct, 100);
    bootFill.style.width = `${progress}%`;
    if (msg) bootText.textContent = msg;
  };

  // Phase 1: Connect to server
  setProgress(10, 'Connecting to server...');
  let connected = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) { connected = true; break; }
    } catch { }
    setProgress(10 + Math.min(i, 20), 'Waiting for server...');
    await new Promise(r => setTimeout(r, 1000));
  }
  if (!connected) {
    setProgress(30, 'Server unreachable. Retrying...');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Phase 2: Wait for model to load
  setProgress(35, 'Loading Whisper model...');
  let loaded = false;
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.loaded) { loaded = true; break; }
      setProgress(35 + Math.min(i * 0.4, 45), `Loading Whisper ${data.model || 'model'}...`);
    } catch { }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Phase 3: Verify microphone access
  setProgress(85, 'Checking microphone access...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of stream.getTracks()) t.stop();
    setProgress(95, 'Microphone ready.');
  } catch {
    setProgress(95, 'Microphone not available.');
  }

  // Phase 4: Done
  setProgress(100, loaded ? 'System ready.' : 'System ready (model still loading).');
  await new Promise(r => setTimeout(r, 600));

  $('#bootScreen').classList.add('fade-out');
  setTimeout(() => {
    $('#bootScreen').style.display = 'none';
    $('#app').classList.add('visible');
    sessionStorage.setItem('vtt-booted', '1');
    checkServer();
  }, 600);
}

// --- Server Health Check ---
async function checkServer() {
  const dot = $('.status-dot');
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    dot.classList.add('connected');
    dot.title = data.loaded ? 'Model loaded' : 'Model loading...';
    fetchStats();
  } catch {
    dot.classList.remove('connected');
    dot.title = 'Server offline';
  }
}

// --- Recording ---
async function toggleRecording() {
  if (isBusy) return;
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up audio analysis for waveform
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;              // More frequency resolution
    analyser.smoothingTimeConstant = 0.6; // Snappier response
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // MediaRecorder
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      sendAudio(blob);
    };

    mediaRecorder.start(250);
    isRecording = true;
    recordingStart = Date.now();

    // Update UI
    $('.mic-btn').classList.add('recording');
    $('.mic-label').classList.add('recording');
    $('.mic-label').textContent = 'Recording... click to stop';
    $('.mic-timer').style.display = 'block';
    $('.waveform').classList.add('active');
    $('.rec-indicator').style.display = 'flex';

    // Hotkey hint
    const hints = $('.hotkey-hints');
    const localKey = keybind.label || 'Space';
    hints.innerHTML = `<span class="hotkey-hint"><kbd>${localKey}</kbd> toggle</span>`;
    hints.style.display = 'flex';

    // Start timer + waveform
    updateTimer();
    timerInterval = setInterval(updateTimer, 100);
    drawWaveform();

  } catch (err) {
    showToast('Microphone access denied');
    console.error('[VTT] Mic error:', err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
  isBusy = true;

  clearInterval(timerInterval);
  cancelAnimationFrame(animFrame);
  resetWaveform();

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Update UI
  $('.mic-btn').classList.remove('recording');
  $('.mic-label').classList.remove('recording');
  $('.mic-label').textContent = 'Click to record';
  $('.mic-timer').style.display = 'none';
  $('.waveform').classList.remove('active');
  $('.rec-indicator').style.display = 'none';
  $('.hotkey-hints').style.display = 'none';

  // Show processing
  processingStart = Date.now();
  updateProcessingTimer();
  processingInterval = setInterval(updateProcessingTimer, 100);
  $('.processing').classList.add('active');
  $('.mic-area').style.display = 'none';
}

function updateProcessingTimer() {
  const elapsed = (Date.now() - processingStart) / 1000;
  $('.processing-timer').textContent = `${elapsed.toFixed(1)}s`;
}

function updateTimer() {
  const elapsed = Date.now() - recordingStart;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const tenths = Math.floor((elapsed % 1000) / 100);
  $('.mic-timer').textContent = `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
}

// --- Premium Waveform Visualizer ---
// Voice-frequency weighted (mel-scale), symmetric, peak-hold, volume-reactive colours
const VIZ_BARS = 128;
const vizSmooth = new Float32Array(VIZ_BARS);  // smoothed bar heights
const vizPeak = new Float32Array(VIZ_BARS);  // peak-hold heights
const vizPeakAge = new Float32Array(VIZ_BARS);  // frames since peak
const PEAK_HOLD = 18;   // frames to hold peak before dropping
const PEAK_FALL = 0.03; // how fast peak falls after hold

// Build mel-scale frequency map — weights human voice (80Hz-8kHz) much more heavily
function buildMelBinMap(sampleRate, binCount) {
  const map = new Uint16Array(VIZ_BARS);
  const melMin = 2595 * Math.log10(1 + 60 / 700);    // 60Hz  — catches deep voices
  const melMax = 2595 * Math.log10(1 + 5000 / 700);  // 5kHz  — covers all speech harmonics
  for (let i = 0; i < VIZ_BARS; i++) {
    const mel = melMin + (i / (VIZ_BARS - 1)) * (melMax - melMin);
    const freq = 700 * (Math.pow(10, mel / 2595) - 1);
    map[i] = Math.min(Math.round(freq / (sampleRate / 2) * binCount), binCount - 1);
  }
  return map;
}

let _melBinMap = null;

function drawWaveform() {
  if (!analyser || !isRecording) return;

  const sampleRate = audioContext ? audioContext.sampleRate : 48000;
  if (!_melBinMap) _melBinMap = buildMelBinMap(sampleRate, analyser.frequencyBinCount);

  const canvas = $('#waveformCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const midY = H / 2;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  // Fade trail
  ctx.fillStyle = 'rgba(10, 10, 15, 0.55)';
  ctx.fillRect(0, 0, W, H);

  const gap = 3;
  const barW = (W - gap * (VIZ_BARS - 1)) / VIZ_BARS;
  const maxH = midY * 0.88;

  // Compute overall volume to shift colour palette
  let totalEnergy = 0;
  for (let i = 0; i < VIZ_BARS; i++) totalEnergy += vizSmooth[i];
  const volume = Math.min(totalEnergy / VIZ_BARS, 1); // 0-1

  for (let i = 0; i < VIZ_BARS; i++) {
    const binStart = _melBinMap[i];
    const binEnd = i < VIZ_BARS - 1 ? _melBinMap[i + 1] : analyser.frequencyBinCount - 1;
    const count = Math.max(1, binEnd - binStart);
    let sum = 0;
    for (let b = binStart; b < binEnd; b++) sum += data[b];
    const raw = (sum / count) / 255;

    // Smooth with fast attack, slow release
    const speed = raw > vizSmooth[i] ? 0.55 : 0.18;
    vizSmooth[i] += (raw - vizSmooth[i]) * speed;
    const val = vizSmooth[i];

    // Peak hold logic
    if (val >= vizPeak[i]) {
      vizPeak[i] = val;
      vizPeakAge[i] = 0;
    } else {
      vizPeakAge[i]++;
      if (vizPeakAge[i] > PEAK_HOLD) vizPeak[i] = Math.max(0, vizPeak[i] - PEAK_FALL);
    }

    const barH = Math.max(1, val * maxH);
    const peakH = Math.max(1, vizPeak[i] * maxH);
    const x = i * (barW + gap);

    // Colour: teal → amber → red based on position & volume
    const t = i / (VIZ_BARS - 1);
    const vv = volume;
    // Low volume: teal. Mid: cyan-to-purple. High: orange-red.
    const r = Math.round(lerp(lerp(78, 232, t), lerp(255, 255, t), vv));
    const g = Math.round(lerp(lerp(205, 100, t), lerp(120, 60, t), vv));
    const b = Math.round(lerp(lerp(196, 220, t), lerp(30, 30, t), vv));
    const color = `rgb(${r},${g},${b})`;

    // Draw upward bar
    ctx.shadowColor = color;
    ctx.shadowBlur = 4 + val * 20;
    ctx.fillStyle = color;
    fillRoundRect(ctx, x, midY - barH, barW, barH, 2);

    // Mirror downward bar (dimmer)
    ctx.globalAlpha = 0.25 + val * 0.2;
    fillRoundRect(ctx, x, midY + 1, barW, barH, 2);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Peak-hold indicator line
    if (vizPeak[i] > 0.03) {
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillRect(x, midY - peakH - 2, barW, 2);
      ctx.shadowBlur = 0;
    }
  }

  // Centre line glow
  const grad = ctx.createLinearGradient(0, midY, W, midY);
  grad.addColorStop(0, `rgba(78,205,196,0)`);
  grad.addColorStop(0.5, `rgba(78,205,196,${0.15 + volume * 0.3})`);
  grad.addColorStop(1, `rgba(78,205,196,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, midY - 1, W, 2);

  // CRT scanline overlay
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  animFrame = requestAnimationFrame(drawWaveform);
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

function fillRoundRect(ctx, x, y, w, h, r) {
  if (h < 1) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.fill();
}

function resetWaveform() {
  vizSmooth.fill(0);
  vizPeak.fill(0);
  vizPeakAge.fill(0);
  _melBinMap = null;
  const canvas = $('#waveformCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// --- Send Audio to Server ---
async function sendAudio(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  try {
    const res = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transcription failed');
    }

    const data = await res.json();
    displayTranscript(data);
    try { localStorage.setItem('vtt-last-transcript', JSON.stringify(data)); } catch { }
    fetchStats();

    // Auto-copy to clipboard
    if (data.text) {
      navigator.clipboard.writeText(data.text).then(() => {
        showToast('Transcription complete — copied to clipboard');
      }).catch(() => {
        showToast('Transcription complete');
      });
    }

  } catch (err) {
    showError(err.message);
    console.error('[VTT] Transcribe error:', err);
  } finally {
    clearInterval(processingInterval);
    $('.processing').classList.remove('active');
    $('.mic-area').style.display = 'flex';
    isBusy = false;
  }
}

// --- Display Transcript ---
function displayTranscript(data) {
  const body = $('.transcript-body');
  const meta = $('.transcript-meta');

  body.innerHTML = '';

  if (data.segments && data.segments.length > 0) {
    data.segments.forEach(seg => {
      const div = document.createElement('div');
      div.className = 'segment';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'segment-time';
      timeSpan.textContent = formatTime(seg.start);

      div.appendChild(timeSpan);
      div.appendChild(document.createTextNode(seg.text));
      body.appendChild(div);
    });
  } else {
    body.textContent = data.text || 'No speech detected.';
  }

  const words = (data.text || '').split(/\s+/).filter(w => w).length;
  const audioDur = data.duration || 0;
  const typingWPM = 50;
  const typingSec = Math.round((words / typingWPM) * 60);
  const saved = Math.max(0, typingSec - Math.round(audioDur));
  meta.innerHTML = `
    <span>${data.language || '?'} // ${words} words</span>
    <span>${audioDur}s audio // ${data.processing_time || 0}s processed</span>
    <span class="time-saved">~${typingSec}s to type // ${saved}s saved</span>
  `;

  $('.transcript-area').classList.add('visible');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `[${m}:${String(s).padStart(2, '0')}]`;
}

function showError(msg) {
  const body = $('.transcript-body');
  body.innerHTML = `<div class="error-msg">// ERROR: ${msg}</div>`;
  $('.transcript-area').classList.add('visible');
}

// --- Actions ---
function copyTranscript() {
  const body = $('.transcript-body');
  const text = body.innerText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard');
  }).catch(() => {
    showToast('Copy failed');
  });
}

function clearTranscript() {
  const body = $('.transcript-body');
  body.innerHTML = '<div class="transcript-empty">// Awaiting input</div>';
  $('.transcript-meta').innerHTML = '';
  $('.transcript-area').classList.remove('visible');
  localStorage.removeItem('vtt-last-transcript');
}

function downloadTranscript() {
  const body = $('.transcript-body');
  const text = body.innerText;
  if (!text || text === '// Awaiting input') return;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded');
}

// --- Stats ---
function formatTimeSaved(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatWordCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

let statsVisible = localStorage.getItem('vtt-stats-visible') !== 'false';

function toggleStats() {
  statsVisible = !statsVisible;
  localStorage.setItem('vtt-stats-visible', statsVisible);
  $('#statsBar').style.display = statsVisible ? 'flex' : 'none';
  $('#btnToggleStats').classList.toggle('active', statsVisible);
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_URL}/stats`);
    const s = await res.json();

    $('#statsTodaySaved').textContent = formatTimeSaved(s.today.saved);
    $('#statsTodayWords').textContent = formatWordCount(s.today.words);
    $('#statsWeekSaved').textContent = formatTimeSaved(s.week.saved);
    $('#statsWeekWords').textContent = formatWordCount(s.week.words);
    $('#statsAllSaved').textContent = formatTimeSaved(s.all_time.saved);
    $('#statsAllWords').textContent = formatWordCount(s.all_time.words);

    $('#statsBar').style.display = statsVisible ? 'flex' : 'none';
    $('#btnToggleStats').classList.toggle('active', statsVisible);
  } catch {
    $('#statsBar').style.display = 'none';
  }
}

async function resetStats() {
  if (!confirm('Reset all time-saved stats? This cannot be undone.')) return;
  try {
    await fetch(`${API_URL}/stats/reset`, { method: 'POST' });
    fetchStats();
    showToast('Stats reset');
  } catch {
    showToast('Failed to reset stats');
  }
}

// --- Settings ---
let currentConfig = {};
let selectedModel = 'base';
let selectedDevice = 'cpu';

async function openSettings() {
  const modal = $('#settingsModal');

  try {
    const res = await fetch(`${API_URL}/config`);
    currentConfig = await res.json();
  } catch {
    currentConfig = { model: 'base', model_path: '', device: 'cpu', compute_type: 'int8', port: 5000 };
  }

  try {
    const res = await fetch(`${API_URL}/models`);
    const models = await res.json();
    renderModelOptions(models);
  } catch {
    renderModelOptions([
      { name: 'tiny', size: '~75 MB' },
      { name: 'base', size: '~150 MB' },
      { name: 'small', size: '~500 MB' },
      { name: 'medium', size: '~1.5 GB' },
      { name: 'turbo', size: '~1.6 GB' },
    ]);
  }

  selectedModel = currentConfig.model || 'base';
  selectedDevice = currentConfig.device || 'cpu';
  $('#inputModelPath').value = currentConfig.model_path || '';
  $('#inputAutoSubmit').checked = !!currentConfig.auto_submit;
  updateSelectedStates();
  $('#settingsNote').textContent = '';

  modal.classList.add('open');
}

function renderModelOptions(models) {
  const container = $('#modelOptions');
  container.innerHTML = '';
  models.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'model-opt';
    btn.dataset.model = m.name;
    btn.innerHTML = `${m.name}<span class="model-opt-size">${m.size}</span>`;
    btn.addEventListener('click', () => {
      selectedModel = m.name;
      updateSelectedStates();
    });
    container.appendChild(btn);
  });
}

function updateSelectedStates() {
  $$('#modelOptions .model-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.model === selectedModel);
  });
  $$('[data-device]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.device === selectedDevice);
  });
}

async function saveSettings() {
  const modelPath = $('#inputModelPath').value.trim();
  const autoSubmit = $('#inputAutoSubmit').checked;
  const note = $('#settingsNote');

  const updates = {
    model: selectedModel,
    device: selectedDevice,
    auto_submit: autoSubmit
  };
  if (modelPath) updates.model_path = modelPath;

  try {
    const res = await fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();

    if (data.needs_restart) {
      note.textContent = '// Config saved. Restart the server to apply model changes.';
      note.style.color = 'var(--orange)';
    } else {
      note.textContent = data.message ? `// ${data.message}` : '// Saved';
      note.style.color = 'var(--teal)';
    }
    showToast('Settings saved');
  } catch {
    note.textContent = '// Error: server unreachable';
    note.style.color = 'var(--orange)';
  }
}

function closeSettings() {
  $('#settingsModal').classList.remove('open');
}

// --- Toast ---
let toastTimeout = null;
function showToast(msg) {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  clearTimeout(toastTimeout);
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// --- Keybinds (browser-local only) ---
let keybind = JSON.parse(localStorage.getItem('vtt-keybind') || 'null') || { code: 'Space', label: 'Space' };
let isCapturingKey = false;

function getKeyLabel(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  const skip = ['Control', 'Alt', 'Shift', 'Meta'];
  if (!skip.includes(e.key)) {
    const names = {
      ' ': 'Space', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
      'ArrowLeft': 'Left', 'ArrowRight': 'Right',
      'Escape': 'Esc', 'Delete': 'Del',
    };
    parts.push(names[e.key] || e.key.length === 1 ? e.key.toUpperCase() : e.key);
  }
  return parts.join(' + ') || e.code;
}

const MOUSE_NAMES = { 0: 'Left Click', 1: 'Middle Click', 2: 'Right Click', 3: 'Mouse 4', 4: 'Mouse 5' };

function startKeyCapture() {
  isCapturingKey = true;
  const btn = $('#keybindBtn');
  btn.textContent = '// Press any key or mouse button...';
  btn.classList.add('capturing');
}

function handleKeybindCapture(e) {
  if (!isCapturingKey) return false;

  if (e.key === 'Escape') {
    isCapturingKey = false;
    const btn = $('#keybindBtn');
    btn.textContent = keybind.label;
    btn.classList.remove('capturing');
    return true;
  }

  const skip = ['Control', 'Alt', 'Shift', 'Meta'];
  if (skip.includes(e.key)) return true;

  e.preventDefault();
  e.stopPropagation();

  keybind = {
    type: 'key',
    code: e.code,
    key: e.key,
    label: getKeyLabel(e),
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
  };
  localStorage.setItem('vtt-keybind', JSON.stringify(keybind));

  isCapturingKey = false;
  const btn = $('#keybindBtn');
  btn.textContent = keybind.label;
  btn.classList.remove('capturing');
  showToast(`Keybind set: ${keybind.label}`);
  return true;
}

function handleMouseCapture(e) {
  if (!isCapturingKey) return false;
  if (e.button === 0) return false;

  e.preventDefault();
  e.stopPropagation();

  keybind = {
    type: 'mouse',
    button: e.button,
    label: MOUSE_NAMES[e.button] || `Mouse ${e.button}`,
  };
  localStorage.setItem('vtt-keybind', JSON.stringify(keybind));

  isCapturingKey = false;
  const btn = $('#keybindBtn');
  btn.textContent = keybind.label;
  btn.classList.remove('capturing');
  showToast(`Keybind set: ${keybind.label}`);
  return true;
}

function matchesKeybind(e) {
  if (keybind.type === 'mouse') return false;
  if (keybind.ctrl && !e.ctrlKey) return false;
  if (keybind.alt && !e.altKey) return false;
  if (keybind.shift && !e.shiftKey) return false;
  return e.code === keybind.code;
}

// --- Zoom ---
const ZOOM_STEPS = [80, 90, 100, 110, 125, 150];
const BASE_FONT_SIZE = 14;
let zoomIndex = 2;

function applyZoom() {
  const pct = ZOOM_STEPS[zoomIndex];
  document.documentElement.style.fontSize = (BASE_FONT_SIZE * pct / 100) + 'px';
  $('#zoomLevel').textContent = pct;
  localStorage.setItem('vtt-zoom', pct);
}

function zoomIn() {
  if (zoomIndex < ZOOM_STEPS.length - 1) { zoomIndex++; applyZoom(); }
}

function zoomOut() {
  if (zoomIndex > 0) { zoomIndex--; applyZoom(); }
}

function restoreZoom() {
  const saved = parseInt(localStorage.getItem('vtt-zoom'));
  if (saved) {
    const idx = ZOOM_STEPS.indexOf(saved);
    if (idx !== -1) { zoomIndex = idx; applyZoom(); }
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  restoreZoom();

  if (sessionStorage.getItem('vtt-booted')) {
    $('#bootScreen').style.display = 'none';
    $('#app').classList.add('visible');
    checkServer();
    try {
      const saved = localStorage.getItem('vtt-last-transcript');
      if (saved) displayTranscript(JSON.parse(saved));
    } catch { }
  } else {
    boot();
  }

  // Mic button
  $('.mic-btn').addEventListener('click', toggleRecording);

  // Transcript actions
  $('#btnCopy').addEventListener('click', copyTranscript);
  $('#btnClear').addEventListener('click', clearTranscript);
  $('#btnDownload').addEventListener('click', downloadTranscript);

  // Zoom
  $('#btnZoomIn').addEventListener('click', zoomIn);
  $('#btnZoomOut').addEventListener('click', zoomOut);

  // Stats
  $('#btnToggleStats').addEventListener('click', toggleStats);

  // Settings
  $('#btnSettings').addEventListener('click', openSettings);
  $('#btnCloseSettings').addEventListener('click', closeSettings);
  $('#btnSaveSettings').addEventListener('click', saveSettings);
  $('#settingsModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSettings();
  });
  $$('[data-device]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDevice = btn.dataset.device;
      updateSelectedStates();
    });
  });

  // Reset stats
  $('#btnResetStats').addEventListener('click', resetStats);

  // Keybind capture
  $('#keybindBtn').addEventListener('click', startKeyCapture);
  $('#keybindBtn').textContent = keybind.label;

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
      sessionStorage.removeItem('vtt-booted');
      return;
    }

    if (handleKeybindCapture(e)) {
      e.preventDefault();
      return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ($('#settingsModal').classList.contains('open')) return;

    if (matchesKeybind(e)) {
      e.preventDefault();
      toggleRecording();
    }
  });

  // Mouse button support
  document.addEventListener('mousedown', (e) => {
    if (handleMouseCapture(e)) return;
    if (keybind.type === 'mouse' && e.button === keybind.button) {
      e.preventDefault();
      if (e.target.closest('button, a, .modal-overlay')) return;
      toggleRecording();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    if (keybind.type === 'mouse' && keybind.button === 2) {
      e.preventDefault();
    }
  });
});
