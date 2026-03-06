#!/usr/bin/env python3
"""
tts_server.py — XTTS v2 TTS endpoint running on the GX10
Serves synthesised Sabrina-voice audio to the Mac Whisper VTT server.

Endpoints:
  POST /tts          { "text": "...", "voice": "sabrina"|"default" }
                     Returns: audio/wav binary

  GET  /health       Returns: { "status": "ok", "voice_loaded": true|false }

Start:
  ~/tts_env311/bin/python tts_server.py

Mac calls it via:
  http://192.168.0.28:5002/tts
"""

import json
import os
import io
import time
import logging
from pathlib import Path
from flask import Flask, request, Response, jsonify

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)

SCRIPT_DIR = Path(__file__).parent
CONFIG_PATH = SCRIPT_DIR / "models" / "sabrina_checkpoint" / "config.json"

tts_engine = None
sabrina_ref_audio = None
sabrina_loaded = False


def load_tts():
    global tts_engine, sabrina_ref_audio, sabrina_loaded
    try:
        from TTS.api import TTS
        log.info("Loading XTTS v2 model...")
        tts_engine = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
        log.info("XTTS v2 loaded.")

        if CONFIG_PATH.exists():
            with open(CONFIG_PATH) as f:
                cfg = json.load(f)
            ref = cfg.get("reference_audio")
            if ref and Path(ref).exists():
                sabrina_ref_audio = ref
                sabrina_loaded = True
                log.info(f"Sabrina reference audio loaded: {ref}")
            else:
                log.warning("Config found but reference audio missing. Run clone_sabrina.sh first.")
        else:
            log.warning("No Sabrina checkpoint found. Run clone_sabrina.sh to set up voice clone.")
    except Exception as e:
        log.error(f"Failed to load TTS: {e}")
        raise


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "voice_loaded": sabrina_loaded,
        "model": "xtts_v2"
    })


@app.route("/tts", methods=["POST"])
def synthesise():
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()
    voice = data.get("voice", "sabrina")

    if not text:
        return jsonify({"error": "text is required"}), 400

    if len(text) > 1000:
        text = text[:1000]

    try:
        t0 = time.time()
        buf = io.BytesIO()

        if voice == "sabrina" and sabrina_loaded:
            tts_engine.tts_to_file(
                text=text,
                speaker_wav=sabrina_ref_audio,
                language="en",
                file_path=buf,
            )
        else:
            # Fallback: default XTTS voice
            tts_engine.tts_to_file(
                text=text,
                language="en",
                file_path=buf,
            )

        latency = round((time.time() - t0) * 1000)
        log.info(f"Synthesised {len(text)} chars in {latency}ms (voice={voice})")

        buf.seek(0)
        return Response(buf.read(), mimetype="audio/wav",
                        headers={"X-Latency-Ms": str(latency)})

    except Exception as e:
        log.error(f"TTS error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    load_tts()
    log.info("TTS server starting on 0.0.0.0:5002")
    app.run(host="0.0.0.0", port=5002, threaded=False)
