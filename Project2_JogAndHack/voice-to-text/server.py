"""
Whisper VTT — Local Voice-to-Text Server
Transcription using faster-whisper. No cloud, no API keys, no subscriptions.
100% offline, 100% private.

https://github.com/nicobailon/whisper-vtt
"""

import os
import sys
import json
import time
import tempfile
import sqlite3
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")

DEFAULTS = {
    "model": "base",
    "model_path": os.path.join(SCRIPT_DIR, ".models"),
    "device": "cpu",
    "compute_type": "int8",
    "port": 5000,
    "ai_loop": False,
    "ollama_url": "http://localhost:11434",
    "ollama_model": "llama3.2:3b",
    "tts_url": "http://localhost:5002",
    "tts_voice": "default",
    "ai_system_prompt": "You are a helpful voice assistant. Give concise answers suitable for speaking aloud. Keep responses under 3 sentences unless the user asks for more detail."
}

def load_config():
    """Load config.json — creates it with defaults on first run."""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            user_cfg = json.load(f)
        cfg = {**DEFAULTS, **user_cfg}
    else:
        cfg = DEFAULTS.copy()
        with open(CONFIG_FILE, "w") as f:
            json.dump(DEFAULTS, f, indent=2)
        print(f"[VTT] Created config.json with defaults")
    return cfg

CONFIG = load_config()

# Point HuggingFace cache to the configured model_path
os.makedirs(CONFIG["model_path"], exist_ok=True)
os.environ["HF_HOME"] = CONFIG["model_path"]
os.environ["HUGGINGFACE_HUB_CACHE"] = os.path.join(CONFIG["model_path"], "hub")

# --- Flask App ---
app = Flask(__name__, static_folder=None)
CORS(app)

# --- SQLite Stats Database ---
DB_PATH = os.path.join(SCRIPT_DIR, "vtt_stats.db")
TYPING_WPM = 40  # average typing speed for time-saved calculation

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            audio_duration REAL NOT NULL,
            word_count INTEGER NOT NULL,
            processing_time REAL NOT NULL,
            time_saved REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    print(f"[VTT] Stats DB: {DB_PATH}")

init_db()

def log_transcription(audio_duration, word_count, processing_time):
    typing_time = (word_count / TYPING_WPM) * 60
    time_saved = max(0, typing_time - audio_duration)
    conn = get_db()
    conn.execute(
        "INSERT INTO transcriptions (timestamp, audio_duration, word_count, processing_time, time_saved) VALUES (?, ?, ?, ?, ?)",
        (datetime.now().isoformat(), audio_duration, word_count, processing_time, time_saved)
    )
    conn.commit()
    conn.close()
    return time_saved

# --- AI Loop Helpers ---
import base64
import urllib.request as _urllib_req

def call_ollama(text):
    """Send text to local Ollama, return response string."""
    payload = json.dumps({
        "model": CONFIG["ollama_model"],
        "system": CONFIG.get("ai_system_prompt", ""),
        "prompt": text,
        "stream": False,
        "options": {"num_predict": 250}
    }).encode()
    req = _urllib_req.Request(
        f"{CONFIG['ollama_url']}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with _urllib_req.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    return data.get("response", "").strip()


def call_tts(text):
    """Send text to TTS server, return WAV bytes or None if unavailable."""
    try:
        payload = json.dumps({
            "text": text,
            "voice": CONFIG.get("tts_voice", "default")
        }).encode()
        req = _urllib_req.Request(
            f"{CONFIG['tts_url']}/tts",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with _urllib_req.urlopen(req, timeout=15) as resp:
            return resp.read()
    except Exception as e:
        print(f"[VTT] TTS unavailable (will use browser TTS): {e}")
        return None


# --- Model Loading ---
MODEL = None

def get_model():
    global MODEL
    if MODEL is None:
        from faster_whisper import WhisperModel
        name = CONFIG["model"]
        print(f"[VTT] Loading Whisper model '{name}'...")
        print(f"[VTT] Cache: {CONFIG['model_path']}")
        print(f"[VTT] First run downloads the model. Hang tight.")
        start = time.time()
        MODEL = WhisperModel(
            name,
            device=CONFIG["device"],
            compute_type=CONFIG["compute_type"],
            cpu_threads=os.cpu_count() or 4
        )
        print(f"[VTT] Model loaded in {time.time() - start:.1f}s")
    return MODEL


# --- Static File Serving ---
@app.route("/")
def serve_index():
    return send_from_directory(SCRIPT_DIR, "index.html")

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(os.path.join(SCRIPT_DIR, "css"), filename)

@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(SCRIPT_DIR, "js"), filename)

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory(os.path.join(SCRIPT_DIR, "assets"), filename)

@app.route("/favicon.svg")
def serve_favicon():
    return send_from_directory(SCRIPT_DIR, "favicon.svg")


# --- API Endpoints ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": CONFIG["model"],
        "device": CONFIG["device"],
        "loaded": MODEL is not None
    })


@app.route("/config", methods=["GET"])
def get_config():
    return jsonify(CONFIG)


@app.route("/config", methods=["POST"])
def update_config():
    global MODEL
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    allowed = {"model", "model_path", "device", "compute_type", "port", "auto_submit",
               "ai_loop", "ollama_url", "ollama_model", "tts_url", "tts_voice", "ai_system_prompt"}
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "No valid fields"}), 400

    new_cfg = {**CONFIG, **updates}
    with open(CONFIG_FILE, "w") as f:
        json.dump(new_cfg, f, indent=2)

    restart_keys = ("model", "model_path", "device", "compute_type")
    needs_restart = any(updates.get(k) != CONFIG.get(k) for k in restart_keys if k in updates)
    CONFIG.update(updates)

    print(f"[VTT] Config updated: {updates}")
    return jsonify({
        "config": new_cfg,
        "needs_restart": needs_restart,
        "message": "Restart server to apply model changes" if needs_restart else "Applied"
    })


@app.route("/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    def agg(where="1=1", params=()):
        row = conn.execute(f"""
            SELECT COALESCE(COUNT(*), 0) as count,
                   COALESCE(SUM(word_count), 0) as words,
                   COALESCE(SUM(time_saved), 0) as saved,
                   COALESCE(SUM(audio_duration), 0) as audio
            FROM transcriptions WHERE {where}
        """, params).fetchone()
        return {"count": row[0], "words": row[1], "saved": round(row[2], 1), "audio": round(row[3], 1)}

    stats = {
        "today": agg("timestamp >= ?", (today_start,)),
        "week": agg("timestamp >= ?", (week_start,)),
        "all_time": agg(),
    }
    conn.close()
    return jsonify(stats)


@app.route("/stats/reset", methods=["POST"])
def reset_stats():
    conn = get_db()
    conn.execute("DELETE FROM transcriptions")
    conn.commit()
    conn.close()
    print("[VTT] Stats reset")
    return jsonify({"status": "ok"})


@app.route("/models", methods=["GET"])
def list_models():
    return jsonify([
        {"name": "tiny",   "size": "~75 MB",  "speed": "fastest", "quality": "basic"},
        {"name": "base",   "size": "~150 MB", "speed": "fast",    "quality": "good"},
        {"name": "small",  "size": "~500 MB", "speed": "medium",  "quality": "great"},
        {"name": "medium", "size": "~1.5 GB", "speed": "slow",    "quality": "excellent"},
        {"name": "turbo",  "size": "~1.6 GB", "speed": "fast",    "quality": "excellent"},
    ])


@app.route("/ai_chat", methods=["POST"])
def ai_chat():
    """Send text to Ollama, optionally get TTS audio back."""
    data = request.get_json()
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text required"}), 400
    try:
        t0 = time.time()
        response_text = call_ollama(text)
        elapsed = round(time.time() - t0, 2)
        print(f"[VTT] Ollama responded in {elapsed}s: {response_text[:80]}...")

        result = {"response": response_text, "model": CONFIG["ollama_model"], "elapsed": elapsed}

        audio_bytes = call_tts(response_text)
        if audio_bytes:
            result["audio_b64"] = base64.b64encode(audio_bytes).decode()

        return jsonify(result)
    except Exception as e:
        print(f"[VTT] AI chat error: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    suffix = ".webm"
    if audio_file.filename:
        _, ext = os.path.splitext(audio_file.filename)
        if ext:
            suffix = ext

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        audio_file.save(tmp.name)
        tmp.close()

        model = get_model()
        start = time.time()
        segments_gen, info = model.transcribe(
            tmp.name,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
            no_speech_threshold=0.3,
            condition_on_previous_text=True,
        )

        segments = []
        full_text_parts = []
        for seg in segments_gen:
            segments.append({
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": seg.text.strip()
            })
            full_text_parts.append(seg.text.strip())

        elapsed = time.time() - start
        full_text = " ".join(full_text_parts)

        print(f"[VTT] Transcribed {info.duration:.1f}s audio in {elapsed:.1f}s "
              f"({info.language}, {len(segments)} segments)")

        word_count = len(full_text.split())
        time_saved = log_transcription(info.duration, word_count, elapsed)

        response_payload = {
            "text": full_text,
            "language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration": round(info.duration, 2),
            "processing_time": round(elapsed, 2),
            "segments": segments,
            "word_count": word_count,
            "time_saved": round(time_saved, 1)
        }

        # AI response loop
        if CONFIG.get("ai_loop") and full_text:
            try:
                t_ai = time.time()
                ai_text = call_ollama(full_text)
                print(f"[VTT] AI loop: {round(time.time()-t_ai,2)}s — {ai_text[:80]}")
                response_payload["ai_response"] = ai_text
                audio_bytes = call_tts(ai_text)
                if audio_bytes:
                    response_payload["ai_audio_b64"] = base64.b64encode(audio_bytes).decode()
            except Exception as e:
                print(f"[VTT] AI loop error: {e}", file=sys.stderr)
                response_payload["ai_error"] = str(e)

        # Check auto_submit configuration
        if CONFIG.get("auto_submit", False) and full_text:
            print("[VTT] Auto-submit enabled. Pasting and pressing Return...")
            try:
                # Put the text on the clipboard
                import subprocess
                p = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
                p.communicate(full_text.encode('utf-8'))
                
                # AppleScript to simulate Cmd+V then Return
                script = '''
                tell application "System Events"
                    keystroke "v" using command down
                    delay 0.1
                    key code 36
                end tell
                '''
                subprocess.run(['osascript', '-e', script])
            except Exception as e:
                print(f"[VTT] Auto-submit failed: {e}")

        return jsonify(response_payload)

    except Exception as e:
        print(f"[VTT] Error: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            os.unlink(tmp.name)
        except:
            pass


if __name__ == "__main__":
    print(f"[VTT] Whisper Voice-to-Text Server")
    print(f"[VTT] Model:  {CONFIG['model']} ({CONFIG['device']}, {CONFIG['compute_type']})")
    print(f"[VTT] Cache:  {CONFIG['model_path']}")
    print(f"[VTT] Port:   {CONFIG['port']}")
    print()

    # Pre-load model so first transcription isn't slow
    get_model()

    print()
    print(f"[VTT] Open http://localhost:{CONFIG['port']} in your browser")
    print()

    try:
        from waitress import serve
        print(f"[VTT] Serving on http://localhost:{CONFIG['port']}")
        serve(app, host="127.0.0.1", port=CONFIG["port"], threads=4)
    except ImportError:
        print("[VTT] Tip: pip install waitress for a production server")
        app.run(host="127.0.0.1", port=CONFIG["port"], debug=False, threaded=True)
