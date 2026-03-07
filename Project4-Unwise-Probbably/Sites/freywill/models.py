"""Ollama model interactions"""
import requests
from typing import List, Optional
from config import OLLAMA_HOST, MODEL_LARGE, MODEL_CODER


def ollama_chat(prompt: str, model: str = MODEL_LARGE, system: Optional[str] = None, 
                max_tokens: int = 1000, timeout: int = 120) -> str:
    """Call Ollama chat API"""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    
    resp = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        json={
            "model": model,
            "messages": messages,
            "options": {"num_predict": max_tokens},
            "stream": False,
        },
        timeout=timeout
    )
    resp.raise_for_status()
    return resp.json()["message"]["content"].strip()


def fetch_url(url: str, timeout: int = 15) -> str:
    """Fetch URL content"""
    headers = {"User-Agent": "freywill-bot/1.0"}
    resp = requests.get(url, timeout=timeout, headers=headers)
    resp.raise_for_status()
    return resp.text
