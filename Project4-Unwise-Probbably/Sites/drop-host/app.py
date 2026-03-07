#!/usr/bin/env python3
"""
DROP & HOST — Instant HTML hosting for hackathon participants
/customhackathondomain.tld/their-chosen-name
Best effort during hackathon
"""
import os
import re
import json
import time
import uuid
import shutil
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template_string, abort, redirect
from werkzeug.utils import secure_filename

# Configure Flask to serve the React build
app = Flask(__name__, static_folder='frontend/dist/assets', template_folder='frontend/dist')

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {'.html', '.htm', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json', '.txt', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm'}

# Active deployments
DEPLOYMENTS = {}
WALLET = "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003"
DOMAIN = "drop-host.aihack26.xyz"  # Placeholder until we buy real domain

os.makedirs(UPLOAD_DIR, exist_ok=True)


def allowed_file(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


def sanitize_path(name):
    """Sanitize user-chosen path name"""
    name = re.sub(r'[^a-zA-Z0-9_-]', '-', name)
    return name[:30] or "site"


@app.route("/")
def index():
    """Serve the React Frontend"""
    return send_from_directory(app.template_folder, "index.html")


@app.route("/<filename>")
def serve_root_files(filename):
    """Serve files from the root of the React build (like images)."""
    file_path = os.path.join(app.template_folder, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(app.template_folder, filename)
    # If not a file, it might be a request for a username missing a trailing slash
    # Let Flask's trailing slash rules handle redirects, or abort.
    return redirect(f"/{filename}/")


@app.route("/<path:username>/")
def serve_user_site(username):
    """Serve user's uploaded site at /their-name/"""
    deployment = DEPLOYMENTS.get(username)
    if not deployment:
        abort(404)
    
    # Serve index.html or directory listing
    index_path = os.path.join(deployment["folder"], "index.html")
    if os.path.exists(index_path):
        return send_from_directory(deployment["folder"], "index.html")
    
    # Look for any HTML file
    for f in os.listdir(deployment["folder"]):
        if f.endswith(".html"):
            return send_from_directory(deployment["folder"], f)
    
    abort(404)


@app.route("/<path:username>/<path:filename>")
def serve_user_file(username, filename):
    """Serve specific file from user's site"""
    deployment = DEPLOYMENTS.get(username)
    if not deployment:
        abort(404)
    
    safe_filename = secure_filename(filename)
    file_path = os.path.join(deployment["folder"], safe_filename)
    
    if os.path.exists(file_path) and allowed_file(safe_filename):
        return send_from_directory(deployment["folder"], safe_filename)
    
    abort(404)


@app.route("/api/deploy", methods=["POST"])
def deploy():
    """Deploy site with custom path"""
    if request.content_length and request.content_length > MAX_CONTENT_LENGTH:
        return jsonify({"error": "Files too large (max 50MB)"}), 413
    
    user_path = request.form.get("path_name", "").strip()
    project_name = request.form.get("project_name", "Untitled").strip()
    wallet = request.form.get("wallet_address", "").strip()
    
    if not user_path:
        return jsonify({"error": "Please choose a path name"}), 400
    
    user_path = sanitize_path(user_path)
    
    # Check if path already taken
    if user_path in DEPLOYMENTS:
        return jsonify({"error": f"Path '/{user_path}' already taken. Try another name."}), 409
    
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400
    
    files = request.files.getlist("files")
    if not files or files[0].filename == "":
        return jsonify({"error": "No files selected"}), 400
    
    # Create project folder
    project_folder = os.path.join(UPLOAD_DIR, user_path)
    os.makedirs(project_folder, exist_ok=True)
    
    # Save files
    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Handle folders by extracting just the filename
            filename = os.path.basename(filename)
            filepath = os.path.join(project_folder, filename)
            file.save(filepath)
            saved_files.append(filename)
    
    if not saved_files:
        shutil.rmtree(project_folder, ignore_errors=True)
        return jsonify({"error": "No valid files uploaded"}), 400
    
    deployment = {
        "path": user_path,
        "name": project_name,
        "folder": project_folder,
        "files": saved_files,
        "wallet": wallet,
        "created": datetime.now().isoformat(),
        "expires": (datetime.now().timestamp() + 86400 * 3),  # 3 days best effort
        "status": "live",
    }
    
    DEPLOYMENTS[user_path] = deployment
    
    return jsonify({
        "success": True,
        "deployment": {
            "path": user_path,
            "url": f"https://{DOMAIN}/{user_path}/",
            "project_name": project_name,
            "files_count": len(saved_files),
            "expires": "3 days (best effort during hackathon)",
        },
        "message": f"🎉 LIVE! https://{DOMAIN}/{user_path}/",
        "tip": {
            "address": WALLET,
            "note": "Tips help extend hosting duration!",
        }
    })


@app.route("/api/sites")
def list_sites():
    """List all deployed sites"""
    sites = []
    for path, dep in DEPLOYMENTS.items():
        sites.append({
            "path": path,
            "name": dep["name"],
            "url": f"https://{DOMAIN}/{path}/",
            "files": len(dep["files"]),
            "created": dep["created"],
        })
    
    return jsonify({
        "domain": DOMAIN,
        "total_sites": len(sites),
        "sites": sites,
    })


@app.route("/.well-known/x402")
def discovery():
    """x402 discovery"""
    return jsonify({
        "serviceId": "drop-host",
        "name": "DROP & HOST — Instant HTML Deployment",
        "description": "Upload frontend code, get custom path. Best effort during hackathon.",
        "version": "1.0.0",
        "domain": DOMAIN,
        "paymentAddress": WALLET,
        "chain": "base",
        "currency": "USDC",
        "pricing": {
            "base": 0,
            "note": "Free during hackathon. Tips welcome!"
        },
    })


# The old HTML form was removed to serve the React app instead.

if __name__ == "__main__":
    print("🚀 DROP & HOST on http://0.0.0.0:5005")
    print(f"   Domain: {DOMAIN}")
    print("   Upload at: /")
    print("   Sites at: /<username>/")
    app.run(host="0.0.0.0", port=4005, debug=False)
