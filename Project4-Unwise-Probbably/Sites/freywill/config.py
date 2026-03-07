"""FREYWILL configuration"""
import os

# Ollama config
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://172.20.0.1:11434")
MODEL_LARGE = "gpt-oss:120b"
MODEL_CODER = "qwen2.5-coder:32b"

# Wallet (REAL MODE - thanks to sponsor!)
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS", "0xD4CD3823A32Cd397fb1b4810Cf5B957A61599003")  # VAULT treasury
CHAIN = "base"
CURRENCY = "USDC"

# Pricing (USDC)
PRICES = {
    "/summarize": 0.001,
    "/complete": 0.001,
    "/review": 0.005,
}

# Limits
RATE_LIMIT_RPM = 10
RATE_LIMIT_RPH = 100
DEMO_MODE = False  # NOW LIVE!
