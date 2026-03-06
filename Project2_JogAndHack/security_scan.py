#!/usr/bin/env python3
"""
🔒 Hardcore Security Scanner for Whisper VTT
Scans the entire codebase for suspicious patterns.
Run: python3 security_scan.py <path_to_voice-to-text_folder>
"""

import os
import re
import sys
import json
import hashlib

# ── Suspicious patterns to scan for ──────────────────────────────────────────

PATTERNS = {
    # Network & data exfiltration
    "External URLs": re.compile(r'https?://(?!localhost|127\.0\.0\.1)[^\s\'")\]>]+', re.I),
    "Fetch/XMLHttpRequest to external": re.compile(r'(fetch|XMLHttpRequest|axios|requests\.(get|post|put))\s*\(', re.I),
    "WebSocket connections": re.compile(r'(WebSocket|ws://|wss://)', re.I),
    "DNS/IP resolution": re.compile(r'(socket\.connect|gethostbyname|getaddrinfo)', re.I),

    # Code obfuscation
    "Base64 encode/decode": re.compile(r'(btoa|atob|b64encode|b64decode|base64)', re.I),
    "Eval/exec execution": re.compile(r'\b(eval|exec|compile)\s*\(', re.I),
    "Dynamic import": re.compile(r'(__import__|importlib)', re.I),

    # File system access
    "Home directory access": re.compile(r'(os\.path\.expanduser|Path\.home|~/)', re.I),
    "SSH/credentials access": re.compile(r'(\.ssh|\.aws|\.env|credentials|password|secret|token|api.?key)', re.I),
    "File read outside project": re.compile(r'open\s*\([^)]*(/etc/|/var/|/usr/)', re.I),

    # Process/system manipulation
    "Subprocess calls": re.compile(r'(subprocess|os\.system|os\.popen|Popen)', re.I),
    "Environment variable access": re.compile(r'(os\.environ|process\.env)', re.I),
    "Crypto mining indicators": re.compile(r'(crypto|miner|stratum|hashrate|coinhive)', re.I),

    # Data collection
    "Cookie/session access": re.compile(r'(document\.cookie|sessionStorage|indexedDB)', re.I),
    "Clipboard snooping": re.compile(r'(navigator\.clipboard\.read|pbpaste|xclip|xsel)', re.I),
    "Keylogging indicators": re.compile(r'(keylogger|onkeypress|addEventListener.*key)', re.I),
    "Screen capture": re.compile(r'(getDisplayMedia|screenshot|screen.?capture)', re.I),
}

SKIP_DIRS = {'.git', 'node_modules', '__pycache__', 'venv', '.venv', '.models'}
SCAN_EXTENSIONS = {'.py', '.js', '.html', '.css', '.json', '.sh', '.bat', '.ps1', '.yaml', '.yml', '.toml', '.cfg', '.ini'}

def hash_file(path):
    """SHA256 hash of a file for integrity tracking."""
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def scan_file(filepath):
    """Scan a single file for all suspicious patterns."""
    findings = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        return [{"pattern": "FILE_READ_ERROR", "line": 0, "content": str(e)}]

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('#') or stripped.startswith('//'):
            continue  # skip comments for reduced noise
        for name, pattern in PATTERNS.items():
            matches = pattern.findall(stripped)
            if matches:
                findings.append({
                    "pattern": name,
                    "line": i,
                    "content": stripped[:200],  # truncate long lines
                    "matches": [str(m) if isinstance(m, str) else str(m) for m in matches[:3]]
                })
    return findings

def scan_directory(root):
    """Walk directory and scan all relevant files."""
    results = {}
    file_hashes = {}
    total_files = 0
    total_findings = 0

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in SCAN_EXTENSIONS:
                continue

            filepath = os.path.join(dirpath, fname)
            relpath = os.path.relpath(filepath, root)
            total_files += 1

            file_hashes[relpath] = hash_file(filepath)
            findings = scan_file(filepath)

            if findings:
                results[relpath] = findings
                total_findings += len(findings)

    return results, file_hashes, total_files, total_findings

def check_dependencies(root):
    """Check requirements.txt for known malicious or typosquatted packages."""
    KNOWN_SAFE = {
        'faster-whisper', 'flask', 'flask-cors', 'waitress',
        'numpy', 'torch', 'torchaudio', 'transformers',
        'huggingface-hub', 'tokenizers', 'safetensors',
        'ctranslate2', 'av', 'onnxruntime',
    }
    KNOWN_TYPOSQUATS = {
        'reqeusts', 'requsets', 'python-openssl', 'python3-openssl',
        'flaskk', 'flaask', 'numpyy', 'colourama',
    }

    req_file = os.path.join(root, 'requirements.txt')
    if not os.path.exists(req_file):
        return [], []

    warnings = []
    safe = []
    with open(req_file) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            pkg = re.split(r'[>=<!\[]', line)[0].strip().lower()
            if pkg in KNOWN_TYPOSQUATS:
                warnings.append(f"🚨 TYPOSQUAT DETECTED: '{pkg}' — DO NOT INSTALL!")
            elif pkg not in KNOWN_SAFE:
                warnings.append(f"⚠️  Unknown package: '{pkg}' — verify on pypi.org")
            else:
                safe.append(f"✅ {pkg}")

    return warnings, safe

def generate_report(root):
    """Generate the full security scan report."""
    print("=" * 60)
    print("🔒 WHISPER VTT SECURITY SCAN REPORT")
    print("=" * 60)
    print(f"Target: {os.path.abspath(root)}")
    print()

    # ── Dependency check ──
    print("── DEPENDENCY AUDIT ──")
    warnings, safe = check_dependencies(root)
    for s in safe:
        print(f"  {s}")
    for w in warnings:
        print(f"  {w}")
    if not warnings:
        print("  🟢 All dependencies verified safe.")
    print()

    # ── Code scan ──
    print("── CODE PATTERN SCAN ──")
    results, hashes, total_files, total_findings = scan_directory(root)

    if not results:
        print("  🟢 No suspicious patterns detected in any file!")
    else:
        for relpath, findings in sorted(results.items()):
            print(f"\n  📄 {relpath}")
            for f in findings:
                severity = "🔴" if f["pattern"] in ("Eval/exec execution", "Crypto mining indicators", "SSH/credentials access") else "🟡"
                print(f"    {severity} L{f['line']:>4} [{f['pattern']}]")
                print(f"         {f['content'][:120]}")

    print()
    print("── FILE INTEGRITY HASHES (SHA-256) ──")
    for relpath, h in sorted(hashes.items()):
        print(f"  {h[:16]}... {relpath}")

    print()
    print("── SUMMARY ──")
    print(f"  Files scanned:    {total_files}")
    print(f"  Findings:         {total_findings}")
    print(f"  Dependency warns: {len(warnings)}")

    risk = "🟢 LOW" if total_findings < 5 and not warnings else "🟡 REVIEW" if total_findings < 15 else "🔴 HIGH"
    print(f"  Overall Risk:     {risk}")
    print()
    print("=" * 60)
    print("Scan complete. Review 🟡 and 🔴 findings manually.")
    print("=" * 60)

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "voice-to-text")
    if not os.path.isdir(target):
        print(f"Error: '{target}' is not a directory.")
        sys.exit(1)
    generate_report(target)
