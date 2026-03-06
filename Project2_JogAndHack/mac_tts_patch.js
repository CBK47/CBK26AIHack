/**
 * mac_tts_patch.js
 * Paste this into your Whisper VTT app.js (or server-side JS) on the Mac.
 * Adds:
 *   - fetchAndPlayTTS(text)  — calls GX10 TTS endpoint, plays audio
 *   - Sabrina voice toggle in UI
 *   - Hooks into the existing auto-submit flow
 *
 * GX10 TTS server: http://192.168.0.28:5002/tts
 */

// ── Config ────────────────────────────────────────────────────────────────────
const TTS_ENDPOINT = "http://192.168.0.28:5002/tts";
const TTS_TIMEOUT_MS = 5000; // max wait before falling back to macOS say

let sabrinaEnabled = localStorage.getItem("sabrinaVoice") !== "false"; // default on

// ── Audio context (reuse across calls) ───────────────────────────────────────
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// ── Core TTS function ─────────────────────────────────────────────────────────
async function fetchAndPlayTTS(text) {
    if (!sabrinaEnabled || !text || !text.trim()) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    try {
        const res = await fetch(TTS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.trim(), voice: "sabrina" }),
            signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`TTS server error: ${res.status}`);

        const arrayBuf = await res.arrayBuffer();
        const ctx = getAudioCtx();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);

        const source = ctx.createBufferSource();
        source.buffer = audioBuf;
        source.connect(ctx.destination);
        source.start(0);

        console.log(`[TTS] Playing ${text.length} chars, latency: ${res.headers.get("X-Latency-Ms")}ms`);
    } catch (err) {
        clearTimeout(timer);
        if (err.name === "AbortError") {
            console.warn("[TTS] Timeout — GX10 unreachable, skipping audio.");
        } else {
            console.error("[TTS] Error:", err.message);
        }
    }
}

// ── Hook into existing auto-submit flow ───────────────────────────────────────
// Call this after you receive the AI response text.
// Replace `onAIResponse` with whatever your current callback is named.
async function onAIResponseWithVoice(aiText) {
    // Play TTS in parallel — don't block the UI
    fetchAndPlayTTS(aiText);

    // Your existing handling here (paste into transcription box, etc.)
    // onAIResponse(aiText);
}

// ── UI Toggle ─────────────────────────────────────────────────────────────────
// Inject a toggle button into the page. Call this from your DOMContentLoaded.
function injectSabrinaToggle() {
    const toggle = document.createElement("div");
    toggle.id = "sabrina-toggle";
    toggle.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: #1a1c25; border: 1px solid #3b3f52;
        border-radius: 12px; padding: 10px 16px;
        font-family: 'Inter', sans-serif; font-size: 13px;
        color: #f0f0f5; cursor: pointer; z-index: 9999;
        display: flex; align-items: center; gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        transition: border-color 0.2s;
    `;
    toggle.innerHTML = `
        <span style="font-size:16px">🎙</span>
        <span id="sabrina-label">Sabrina: ${sabrinaEnabled ? "ON" : "OFF"}</span>
    `;

    toggle.addEventListener("click", () => {
        sabrinaEnabled = !sabrinaEnabled;
        localStorage.setItem("sabrinaVoice", sabrinaEnabled ? "true" : "false");
        document.getElementById("sabrina-label").textContent =
            `Sabrina: ${sabrinaEnabled ? "ON" : "OFF"}`;
        toggle.style.borderColor = sabrinaEnabled ? "#60a5fa" : "#3b3f52";
    });

    toggle.style.borderColor = sabrinaEnabled ? "#60a5fa" : "#3b3f52";
    document.body.appendChild(toggle);
}

document.addEventListener("DOMContentLoaded", injectSabrinaToggle);
