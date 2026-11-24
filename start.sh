#!/bin/bash
# Unrestricted Local AI Manager & Web UI Launcher for Apple Silicon Mac (M1 Air)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo "  🚀 Starting Unrestricted Local AI + Claude UI (M1 Mac)"
echo "========================================================"

# 1. Check & Start Ollama
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama with Apple Metal GPU acceleration..."
    export OLLAMA_HOST="0.0.0.0:11434"
    export OLLAMA_ORIGINS="*"
    export OLLAMA_NUM_PARALLEL=1
    nohup /opt/homebrew/bin/ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
else
    echo "✅ Ollama is already running on port 11434."
fi

# 2. Check & Start Cloudflare Quick Tunnel
if ! pgrep -x "cloudflared" > /dev/null; then
    echo "Starting Cloudflare Secure Tunnel..."
    nohup /opt/homebrew/bin/cloudflared tunnel --protocol http2 --url http://127.0.0.1:11434 > /tmp/tunnel.log 2>&1 &
    sleep 5
fi

TUNNEL_URL=$(grep -a -o 'https://[a-zA-Z0-9-]\+\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | tail -n 1)
echo "✅ Cloudflare Tunnel Gateway: ${TUNNEL_URL:-https://practical-hundreds-console-payment.trycloudflare.com}"

# 3. Start Local Web Server for Claude UI
PORT=3000
echo "✅ Launching Claude Web UI on http://localhost:$PORT..."
pkill -f "python3 -m http.server $PORT" 2>/dev/null
nohup python3 -m http.server $PORT --directory "$DIR" > /tmp/webui.log 2>&1 &
sleep 1

# Open in default browser
open "http://localhost:$PORT"

echo "========================================================"
echo "  🎉 Ready! Opening Claude UI in your browser..."
echo "  Local UI:      http://localhost:$PORT"
echo "  Public API:    ${TUNNEL_URL:-https://practical-hundreds-console-payment.trycloudflare.com}"
echo "  Active Model:  llama3-abliterated:latest"
echo "========================================================"

