#!/usr/bin/env python3
"""Linktree - Simple static file server"""
from flask import Flask, send_from_directory
import os

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    # send_from_directory uses safe_join internally (raises NotFound if path escapes BASE_DIR),
    # but we also explicitly reject any traversal attempts up front.
    if ".." in filename or filename.startswith("/"):
        from flask import abort
        abort(404)
    return send_from_directory(BASE_DIR, filename)

if __name__ == "__main__":
    print("🔗 LINKTREE on http://0.0.0.0:4007")
    app.run(host="0.0.0.0", port=4007, debug=False)
