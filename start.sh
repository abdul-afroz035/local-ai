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

# 2. Check & Start Cloudflare Quick Tunnel (restart if missing or returning 530/error)
NEED_TUNNEL_START=false
if ! pgrep -x "cloudflared" > /dev/null; then
    NEED_TUNNEL_START=true
else
    EXISTING_URL=$(grep -a -o 'https://[a-zA-Z0-9-]\+\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | tail -n 1)
    if [ -z "$EXISTING_URL" ] || ! curl -sf --max-time 5 "$EXISTING_URL/api/tags" > /dev/null 2>&1; then
        echo "⚠️  Existing Cloudflare Tunnel is unhealthy. Restarting..."
        pkill -x "cloudflared" 2>/dev/null
        sleep 1
        NEED_TUNNEL_START=true
    fi
fi

if [ "$NEED_TUNNEL_START" = true ]; then
    echo "Starting Cloudflare Secure Tunnel..."
    rm -f /tmp/tunnel.log
    nohup /opt/homebrew/bin/cloudflared tunnel --protocol http2 --url http://127.0.0.1:11434 > /tmp/tunnel.log 2>&1 &
fi

# Wait up to 15 seconds for Cloudflare Tunnel URL to appear
TUNNEL_URL=""
for i in {1..15}; do
    TUNNEL_URL=$(grep -a -o 'https://[a-zA-Z0-9-]\+\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | tail -n 1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Cloudflare Tunnel Gateway: $TUNNEL_URL"

    # Auto-sync new tunnel URL to src/lib/config.js and Vercel if it changed
    CURRENT_CONFIG_URL=$(grep -o "ACTIVE_TUNNEL_URL = '[^']*'" "$DIR/src/lib/config.js" | cut -d"'" -f2)
    if [ "$TUNNEL_URL" != "$CURRENT_CONFIG_URL" ]; then
        echo "🔄 New tunnel detected! Updating config and syncing Vercel in background..."
        sed -i '' "s|export const ACTIVE_TUNNEL_URL = '.*';|export const ACTIVE_TUNNEL_URL = '$TUNNEL_URL';|" "$DIR/src/lib/config.js"
        (
            cd "$DIR"
            /opt/homebrew/bin/bun run build > /tmp/vercel_sync.log 2>&1 && \
            npx --yes vercel --prod --yes >> /tmp/vercel_sync.log 2>&1
        ) &
    fi
else
    echo "⚠️  Cloudflare Tunnel URL not found yet. Check /tmp/tunnel.log."
fi

# 3. Start Local Web Server for React Claude UI
PORT=3000
echo "✅ Launching React Claude Web UI on http://localhost:$PORT..."
pkill -f "python3 -m http.server $PORT" 2>/dev/null
pkill -f "vite preview --port $PORT" 2>/dev/null
pkill -f "bun.*$PORT" 2>/dev/null

if [ ! -d "$DIR/dist" ]; then
    /opt/homebrew/bin/bun run build > /dev/null 2>&1
fi

if [ -f "/opt/homebrew/bin/bun" ]; then
    nohup /opt/homebrew/bin/bun run preview --port $PORT > /tmp/webui.log 2>&1 &
else
    nohup npx vite preview --port $PORT > /tmp/webui.log 2>&1 &
fi
sleep 2

# Open local UI in default browser
open "http://localhost:$PORT"

echo "========================================================"
echo "  🎉 Ready! Local AI is live."
echo "  Local UI:      http://localhost:$PORT"
if [ -n "$TUNNEL_URL" ]; then
echo "  Instant Vercel: https://unrestricted-claude-ui.vercel.app?gateway=$TUNNEL_URL"
fi
echo "  Public Vercel: https://unrestricted-claude-ui.vercel.app (auto-syncing)"
echo "  Public API:    ${TUNNEL_URL:-Check /tmp/tunnel.log}"
echo "  Active Model:  llama3-abliterated:latest"
echo "========================================================"
