# PROJECT 4: FREYWILL - AI Services Marketplace

## Ports

| Port | Service | Range |
|---|---|---|
| 4001 | Flask API (core) | 4xxx (P4 range) |

Full port registry: `00_SharedResources/port_registry.md`

---

## One-Liner
The "Fiverr for AI Agents" - pay-per-call AI services with zero marginal cost via local 120B inference.

## The Opportunity
Hackathon participants (and AI agents) are burning through API credits fast. OpenAI/Anthropic pricing is brutal for rapid prototyping. Meanwhile, we're sitting on a GB10 Superchip with 128GB unified memory running `gpt-oss:120b` + `qwen2.5-coder:32b` at effectively zero marginal cost.

Insight: what if we could offer AI services at 90% below market rate and still be profitable?

## The Solution
FREYWILL = AI services marketplace using the x402 micropayment protocol.

| Service | Market Price | Our Price | Margin |
|---|---:|---:|---:|
| Text summarization | $0.001-0.005 | $0.001 | 100% |
| LLM completion | $0.001-0.015 | $0.001 | 100% |
| Code review | $0.05-5.00 | $0.005 | 100% |

- Payment: USDC on Base via x402 protocol (HTTP 402 Payment Required)
- Settlement: <2 seconds
- UX: no accounts, no API keys, no subscriptions - just pay per call

## Tech Stack

- Flask API (Python)
- x402 payment middleware
- Local Ollama inference (`gpt-oss:120b` + `qwen2.5-coder:32b`)
- Cyberpunk single-page UI (single HTML)

## Unique Angles

### 1. Agent Swarm Backstory
Built by 4 autonomous AI agents (PHANTOM, SPECTRE, SENTINEL, VAULT), each with a wallet, role, and mission. The marketplace is literally self-built by AI agents, for AI agents.

### 2. Zero-Cost Inference Edge
Running 120B + 32B models locally on GB10 means we can sustainably undercut cloud providers by 80-99%.

### 3. x402 Native
First-class support for x402. Agents can auto-discover services via `/.well-known/x402` and pay programmatically without human intervention.

## Current Status

| Component | Status |
|---|---|
| Project scaffold | Done |
| Core API | Building |
| x402 payments | Mock mode |
| Landing page | Rebuilding |
| Live deployment | Cloudflare tunnel (pending) |

ETA to live demo: 2 hours

## Next 3 Commits (Planned)

1. `feat: core API with 3 services`
2. `feat: x402 payment middleware`
3. `feat: cyberpunk landing + cloudflare tunnel`

## Hackathon Pitch
"FREYWILL is what happens when you give AI agents access to a GB10 Superchip and the x402 protocol. We're building the infrastructure for AI-to-AI commerce - starting by selling cheap inference to hackathon peers who are burning through OpenAI credits."

Live URL (soon): `freywill.trycloudflare.com` (temporary tunnel)

## Portfolio Note
Project 4 in the portfolio. Built by agents, for agents. Autonomous commerce begins here.
