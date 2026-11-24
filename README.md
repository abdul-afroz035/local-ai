# Unrestricted Local LLM on Apple Silicon (M1 Mac) + Claude UI

A complete setup for running high-speed, uncensored / abliterated local language models on Apple Silicon with full Metal GPU acceleration, a secure public Cloudflare Tunnel, and a Claude-style web chat interface.

---

## ⚡ Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    Claude Web UI (Local & Vercel)    │
                      │  - Dark theme & Claude styling       │
                      │  - Markdown & Syntax Highlighting    │
                      │  - Artifacts slideout panel          │
                      │  - Realtime token streaming          │
                      └──────────────────┬───────────────────┘
                                         │
                   HTTPS / WSS           │           Direct HTTP
            (Remote / Anywhere)          │         (Zero latency)
                                         ▼
   ┌──────────────────────────────────────────┐    ┌───────────────────────────┐
   │ Cloudflare Tunnel Gateway                │    │ Local Mac Port            │
   │ https://...trycloudflare.com             │    │ http://127.0.0.1:11434    │
   └─────────────────────┬────────────────────┘    └─────────────┬─────────────┘
                         │                                       │
                         └───────────────────┬───────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────┐
                      │    Ollama Engine (v0.40.16)          │
                      │    - Apple Metal GPU acceleration    │
                      │    - Prompt eval: ~45 tok/s          │
                      │    - Gen speed: ~9-11 tok/s          │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │ Llama-3-8B Abliterated v3 (Q4_K_M)   │
                      │ Mathematical refusal vectors removed │
                      │ Zero moralizing censorship           │
                      └──────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Launch Everything with One Command
Double click or run `start.sh` in Terminal:
```bash
cd "/Users/afroz/Desktop/Local Ai"
./start.sh
```
This automatically verifies Ollama, initiates the Cloudflare Tunnel, launches the Claude Web UI at **`http://localhost:3000`**, and opens it in your default browser.

---

## 🌐 Deploy to Vercel

### Option 1: Deploy this Custom Claude UI
1. Run in Terminal:
   ```bash
   cd "/Users/afroz/Desktop/Local Ai"
   npx vercel
   ```
2. Log in with your Vercel account when prompted. It deploys the static Claude UI instantly!

### Option 2: Deploy LobeChat to Vercel
1. Click the [LobeChat 1-Click Deploy Link](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flobehub%2Flobe-chat&project-name=lobe-chat-unrestricted)
2. Enter these Environment Variables:
   - `OLLAMA_PROXY_URL`: `https://practical-hundreds-console-payment.trycloudflare.com`
   - `CUSTOM_MODELS`: `llama3-abliterated:latest`
3. Click **Deploy**.

---

## 🔌 API Endpoints (OpenAI-Compatible)

- **Chat Completions:**
  ```bash
  curl -s https://practical-hundreds-console-payment.trycloudflare.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
      "model": "llama3-abliterated:latest",
      "messages": [{"role": "user", "content": "Hello!"}],
      "temperature": 0.7
    }'
  ```

- **List Models:**
  ```bash
  curl -s https://practical-hundreds-console-payment.trycloudflare.com/v1/models
  ```

