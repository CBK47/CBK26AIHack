#!/bin/bash
# clone_sabrina.sh — Generate a Sabrina voice checkpoint using XTTS v2
# Usage: ./clone_sabrina.sh <path-to-audio-sample.wav|aiff>
# Audio sample: 30-60 seconds of clean Sabrina speech, no background noise
# Output: models/sabrina_checkpoint/ — used by tts_server.py

set -e

VENV="$HOME/tts_env311"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/models/sabrina_checkpoint"
SAMPLE="${1:-$SCRIPT_DIR/test_audio.aiff}"

if [ ! -f "$SAMPLE" ]; then
    echo "ERROR: Audio sample not found: $SAMPLE"
    echo "Usage: $0 <path-to-audio-sample>"
    exit 1
fi

echo "=== Sabrina Voice Clone Setup ==="
echo "Sample : $SAMPLE"
echo "Output : $OUTPUT_DIR"
echo ""

mkdir -p "$OUTPUT_DIR"

# Convert to WAV if needed (XTTS requires WAV)
SAMPLE_WAV="$OUTPUT_DIR/sabrina_reference.wav"
if [[ "$SAMPLE" == *.aiff || "$SAMPLE" == *.aif ]]; then
    echo "Converting AIFF -> WAV..."
    ffmpeg -y -i "$SAMPLE" -ar 22050 -ac 1 "$SAMPLE_WAV" 2>&1
else
    echo "Copying sample to output dir..."
    ffmpeg -y -i "$SAMPLE" -ar 22050 -ac 1 "$SAMPLE_WAV" 2>&1
fi

echo ""
echo "Downloading XTTS v2 model (first run only — ~2GB)..."
"$VENV/bin/python" - <<'PYTHON'
from TTS.api import TTS
import os

# This triggers the XTTS v2 model download on first run
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
print("XTTS v2 model ready.")
PYTHON

# Save a config pointing to the reference audio
cat > "$OUTPUT_DIR/config.json" <<JSON
{
    "model": "tts_models/multilingual/multi-dataset/xtts_v2",
    "reference_audio": "$SAMPLE_WAV",
    "language": "en",
    "gpu": true
}
JSON

echo ""
echo "=== Done ==="
echo "Reference audio : $SAMPLE_WAV"
echo "Config saved    : $OUTPUT_DIR/config.json"
echo ""
echo "Start the TTS server with:"
echo "  $VENV/bin/python $SCRIPT_DIR/tts_server.py"
