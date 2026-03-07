"""FREYWILL Flask application"""
import re
from flask import Flask, request, jsonify, send_from_directory
from config import PRICES, WALLET_ADDRESS, CHAIN, CURRENCY, MODEL_LARGE, MODEL_CODER
from payments import payment_required
from models import ollama_chat, fetch_url

app = Flask(__name__)


def sanitize(text: str) -> str:
    if not text:
        return text
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text.strip()[:20000]


@app.route("/summarize", methods=["POST"])
@payment_required
def summarize():
    """Summarize text or URL ($0.001)"""
    data = request.json or {}
    url = data.get("url")
    text = data.get("text")
    length = data.get("length", "medium")
    
    if url:
        try:
            text = fetch_url(url)
        except Exception as e:
            return jsonify({"error": f"Fetch failed: {e}"}), 400
    
    if not text:
        return jsonify({"error": "Provide 'url' or 'text'"}), 400
    
    text = sanitize(text)[:12000]
    system = f"Summarize. Length: {length}. Plain text only."
    
    try:
        summary = ollama_chat(text, system=system, max_tokens=800)
    except Exception as e:
        return jsonify({"error": f"Inference failed: {e}"}), 500
    
    return jsonify({
        "summary": summary,
        "chars": len(text),
        "price": PRICES["/summarize"]
    })


@app.route("/complete", methods=["POST"])
@payment_required
def complete():
    """LLM completion ($0.001)"""
    data = request.json or {}
    prompt = data.get("prompt", "")
    system = data.get("system")
    mode = data.get("mode", "chat")
    max_tokens = min(int(data.get("max_tokens", 800)), 2000)
    
    if not prompt:
        return jsonify({"error": "Provide 'prompt'"}), 400
    
    model = MODEL_CODER if mode == "code" else MODEL_LARGE
    
    try:
        result = ollama_chat(sanitize(prompt), model=model, system=system, max_tokens=max_tokens)
    except Exception as e:
        return jsonify({"error": f"Inference failed: {e}"}), 500
    
    return jsonify({
        "result": result,
        "model": model,
        "price": PRICES["/complete"]
    })


@app.route("/review", methods=["POST"])
@payment_required
def review():
    """Code review ($0.005)"""
    data = request.json or {}
    code = data.get("code", "")
    language = data.get("language", "")
    
    if not code:
        return jsonify({"error": "Provide 'code'"}), 400
    
    system = (
        "Senior code reviewer. Analyze bugs, security, performance, style. "
        "Return markdown: Summary, Issues (severity), Suggestions, Verdict."
    )
    prompt = f"Language: {language or 'auto'}\n\n```\n{code[:8000]}\n```"
    
    try:
        review_text = ollama_chat(prompt, model=MODEL_CODER, system=system, max_tokens=1500)
    except Exception as e:
        return jsonify({"error": f"Inference failed: {e}"}), 500
    
    return jsonify({
        "review": review_text,
        "price": PRICES["/review"]
    })


@app.route("/.well-known/x402")
def discovery():
    """x402 service discovery"""
    return jsonify({
        "serviceId": "freywill",
        "name": "FREYWILL AI Services",
        "description": "Pay-per-call AI. 120B local inference, 90% below market.",
        "version": "1.0.0-poc",
        "paymentAddress": WALLET_ADDRESS,
        "chain": CHAIN,
        "currency": CURRENCY,
        "demoMode": False,  # LIVE MODE - funded by sponsor!
        "endpoints": [
            {"path": "/summarize", "method": "POST", "price": PRICES["/summarize"]},
            {"path": "/complete", "method": "POST", "price": PRICES["/complete"]},
            {"path": "/review", "method": "POST", "price": PRICES["/review"]},
        ]
    })


@app.route("/health")
def health():
    """Health check"""
    import requests
    try:
        r = requests.get("http://172.20.0.1:11434/api/tags", timeout=3)
        ollama_ok = r.status_code == 200
    except:
        ollama_ok = False
    
    return jsonify({
        "status": "healthy" if ollama_ok else "degraded",
        "ollama": ollama_ok,
        "services": list(PRICES.keys()),
    })


@app.route("/")
def index():
    """Landing page"""
    return send_from_directory(".", "index.html")


if __name__ == "__main__":
    print("🤖 FREYWILL AI on http://0.0.0.0:4001")
    print("   /           - Landing page")
    print("   /summarize  - Summarization (x402)")
    print("   /review     - Code review (x402)")
    print("   /health     - Health check")
    app.run(host="0.0.0.0", port=4001, debug=False)
