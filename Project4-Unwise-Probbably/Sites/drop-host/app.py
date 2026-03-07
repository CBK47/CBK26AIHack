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
from collections import defaultdict, deque
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template_string, abort, redirect
from werkzeug.utils import secure_filename

# Configure Flask to serve the React build
app = Flask(__name__, static_folder='frontend/dist/assets', template_folder='frontend/dist')
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ALLOWED_EXTENSIONS = {'.html', '.htm'}
MAX_SCAN_BYTES = int(os.getenv("DROP_HOST_MAX_SCAN_BYTES", "500000"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("DROP_HOST_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_DEPLOYS = int(os.getenv("DROP_HOST_RATE_LIMIT_MAX_DEPLOYS", "20"))

PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
    re.compile(r"(reveal|print|show)\s+(the\s+)?(system|developer)\s+prompt", re.IGNORECASE),
    re.compile(r"\b(jailbreak|developer\s*mode|dan\s+mode)\b", re.IGNORECASE),
    re.compile(r"BEGIN\s+(SYSTEM|PROMPT|INSTRUCTIONS)", re.IGNORECASE),
    re.compile(r"(exfiltrate|steal|dump)\s+(secrets?|tokens?|credentials?)", re.IGNORECASE),
]

# Active deployments
DEPLOYMENTS = {}
RATE_LIMIT_BUCKETS = defaultdict(deque)
WALLET = "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003"
DOMAIN = "drop.aihack26.xyz"

os.makedirs(UPLOAD_DIR, exist_ok=True)


def allowed_file(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


def safe_relative_path(raw_path):
    """Sanitize a file path while preserving subdirectory structure.

    secure_filename() alone flattens 'css/main.css' → 'cssmain.css', breaking
    relative references in uploaded HTML. This function sanitizes each component
    individually so directory structure is preserved for multi-file sites.
    """
    parts = raw_path.replace("\\", "/").split("/")
    safe_parts = []
    for part in parts:
        if part in ("", ".", ".."):
            continue
        safe_part = secure_filename(part)
        if safe_part:
            safe_parts.append(safe_part)
    return os.path.join(*safe_parts) if safe_parts else None


def sanitize_path(name):
    """Sanitize user-chosen path name"""
    name = re.sub(r'[^a-zA-Z0-9_-]', '-', name)
    return name[:30] or "site"


def as_bool(value):
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def get_client_ip():
    xff = request.headers.get("X-Forwarded-For", "").strip()
    if xff:
        return xff.split(",")[0].strip()
    return request.remote_addr or "unknown"


def rate_limit_allowed(ip):
    now = time.time()
    bucket = RATE_LIMIT_BUCKETS[ip]
    while bucket and (now - bucket[0]) > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_DEPLOYS:
        retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - bucket[0])))
        return False, retry_after
    bucket.append(now)
    return True, None


def contains_prompt_injection(text):
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            return True
    return False


def deployment_has_html(dep):
    for file_name in dep.get("files", []):
        if allowed_file(file_name):
            return True
    return False


def deployments_index_file():
    return os.path.join(UPLOAD_DIR, "deployments_index.json")


def save_deployments_index():
    serializable = {}
    for path, dep in DEPLOYMENTS.items():
        serializable[path] = {
            "path": dep.get("path", path),
            "name": dep.get("name", "Untitled"),
            "files": dep.get("files", []),
            "wallet": dep.get("wallet", ""),
            "created": dep.get("created", datetime.now().isoformat()),
            "expires": dep.get("expires", datetime.now().timestamp() + 86400 * 3),
            "status": dep.get("status", "live"),
            "unlisted": dep.get("unlisted", False),
        }
    with open(deployments_index_file(), "w", encoding="utf-8") as f:
        json.dump(serializable, f, indent=2)


def restore_from_upload_folders():
    now = datetime.now()
    for entry in os.listdir(UPLOAD_DIR):
        folder = os.path.join(UPLOAD_DIR, entry)
        if not os.path.isdir(folder):
            continue
        files = []
        for root, _, filenames in os.walk(folder):
            for filename in filenames:
                rel = os.path.relpath(os.path.join(root, filename), folder)
                files.append(rel)
        if not files:
            continue
        DEPLOYMENTS[entry] = {
            "path": entry,
            "name": entry.replace("-", " ").title(),
            "folder": folder,
            "files": files,
            "wallet": "",
            "created": datetime.fromtimestamp(os.path.getmtime(folder)).isoformat(),
            "expires": (now.timestamp() + 86400 * 3),
            "status": "live",
            "unlisted": "unlisted" in entry.lower(),
        }


def load_deployments_index():
    DEPLOYMENTS.clear()
    if os.path.exists(deployments_index_file()):
        try:
            with open(deployments_index_file(), "r", encoding="utf-8") as f:
                raw = json.load(f)
            for path, dep in raw.items():
                folder = os.path.join(UPLOAD_DIR, path)
                if not os.path.isdir(folder):
                    continue
                DEPLOYMENTS[path] = {
                    "path": path,
                    "name": dep.get("name", "Untitled"),
                    "folder": folder,
                    "files": dep.get("files", []),
                    "wallet": dep.get("wallet", ""),
                    "created": dep.get("created", datetime.now().isoformat()),
                    "expires": dep.get("expires", datetime.now().timestamp() + 86400 * 3),
                    "status": dep.get("status", "live"),
                    "unlisted": dep.get("unlisted", False),
                }
        except (OSError, json.JSONDecodeError):
            DEPLOYMENTS.clear()
    if not DEPLOYMENTS:
        restore_from_upload_folders()
    save_deployments_index()


@app.route("/")
def index():
    """Serve the React Frontend"""
    return send_from_directory(app.template_folder, "index.html")


@app.route("/assets/<path:filename>")
def serve_assets(filename):
    """Serve bundled frontend assets from the Vite build output."""
    assets_dir = os.path.join(app.template_folder, "assets")
    return send_from_directory(assets_dir, filename)


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
    
    safe_filename = safe_relative_path(filename)
    if not safe_filename:
        abort(404)
    file_path = os.path.join(deployment["folder"], safe_filename)

    if os.path.exists(file_path) and os.path.isfile(file_path) and allowed_file(safe_filename):
        return send_from_directory(deployment["folder"], safe_filename)
    
    abort(404)


@app.route("/api/deploy", methods=["POST"])
def deploy():
    """Deploy site with custom path"""
    ip = get_client_ip()
    allowed, retry_after = rate_limit_allowed(ip)
    if not allowed:
        return jsonify({
            "error": f"Rate limit exceeded. Try again in {retry_after}s.",
            "retry_after": retry_after,
        }), 429

    if request.content_length and request.content_length > MAX_CONTENT_LENGTH:
        return jsonify({"error": "Files too large (max 50MB)"}), 413
    
    user_path = request.form.get("path_name", "").strip()
    project_name = request.form.get("project_name", "Untitled").strip()
    wallet = request.form.get("wallet_address", "").strip()
    unlisted = as_bool(request.form.get("unlisted"))

    scan_fields = [user_path, project_name, wallet]
    if any(contains_prompt_injection(field) for field in scan_fields if field):
        return jsonify({"error": "Upload rejected by content safety checks"}), 422
    
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

    # Save files — preserve subdirectory structure so relative CSS/JS refs work
    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            rel_path = safe_relative_path(file.filename)
            if not rel_path:
                continue

            # Prompt-injection guardrail: scan HTML payload for known injection phrases.
            file_bytes = file.read(MAX_SCAN_BYTES + 1)
            file.stream.seek(0)
            if len(file_bytes) > MAX_SCAN_BYTES:
                shutil.rmtree(project_folder, ignore_errors=True)
                return jsonify({"error": "HTML file too large for safety scan"}), 413
            try:
                file_text = file_bytes.decode("utf-8", errors="strict")
            except UnicodeDecodeError:
                shutil.rmtree(project_folder, ignore_errors=True)
                return jsonify({"error": "Only UTF-8 HTML files are supported"}), 400
            if contains_prompt_injection(file_text):
                shutil.rmtree(project_folder, ignore_errors=True)
                return jsonify({"error": "Upload rejected by content safety checks"}), 422

            filepath = os.path.join(project_folder, rel_path)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            saved_files.append(rel_path)
    
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
        "unlisted": unlisted,
    }
    
    DEPLOYMENTS[user_path] = deployment
    save_deployments_index()
    
    return jsonify({
        "success": True,
        "deployment": {
            "path": user_path,
            "url": f"https://{DOMAIN}/{user_path}/",
            "project_name": project_name,
            "files_count": len(saved_files),
            "expires": "3 days (best effort during hackathon)",
            "unlisted": unlisted,
        },
        "message": f"🎉 LIVE! https://{DOMAIN}/{user_path}/",
        "tip": {
            "address": WALLET,
            "note": "Tips help extend hosting duration!",
        }
    })


load_deployments_index()


@app.route("/api/sites")
def list_sites():
    """List all deployed sites"""
    sites = []
    for path, dep in DEPLOYMENTS.items():
        if dep.get("unlisted"):
            continue
        if not deployment_has_html(dep):
            continue
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
    print("🚀 DROP & HOST on http://0.0.0.0:4005")
    print(f"   Domain: {DOMAIN}")
    print("   Upload at: /")
    print("   Sites at: /<username>/")
    app.run(host="0.0.0.0", port=4005, debug=False)
