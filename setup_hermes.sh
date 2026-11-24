#!/bin/bash
# 1-Click Setup: Connect Hermes Agent Harness to Local Unrestricted AI (M1 Mac)

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "================================================================"
echo "  🚀 Connecting Hermes Agent Harness to Local Unrestricted AI"
echo "================================================================"

# 1. Ensure Local AI Backend is running
if ! curl -s http://127.0.0.1:11434/v1/models | grep -q "llama3-abliterated"; then
    echo "Starting Ollama local backend with Apple Metal GPU acceleration..."
    ./start.sh
    sleep 3
else
    echo "✅ Local Ollama AI backend is running on http://127.0.0.1:11434"
fi

# 2. Deploy Hermes Configuration to ~/.hermes/config.yaml
mkdir -p ~/.hermes
cp "$DIR/hermes_config.yaml" ~/.hermes/config.yaml
echo "✅ Configured ~/.hermes/config.yaml with model: llama3-abliterated:latest"

# 3. Create dedicated Virtual Environment for Hermes Harness
if [ ! -d "$DIR/hermes_env" ]; then
    echo "📦 Creating virtual environment for Hermes Agent..."
    python3 -m venv "$DIR/hermes_env"
fi

echo "📦 Installing Hermes Agent and OpenAI API client..."
source "$DIR/hermes_env/bin/activate"
pip install --upgrade pip > /dev/null
pip install hermes-agent openai requests > /dev/null

echo "================================================================"
echo "  🎉 Hermes Agent Harness is Connected and Ready!"
echo "================================================================"
echo ""
echo "How to use:"
echo "  1. Run an interactive agent session:"
echo "     source \"$DIR/hermes_env/bin/activate\""
echo "     hermes"
echo ""
echo "  2. Run a one-shot agent command:"
echo "     source \"$DIR/hermes_env/bin/activate\""
echo "     hermes \"Search my home folder for recent Python scripts and summarize them\""
echo ""
echo "  3. Use the Python API directly:"
echo "     python3 \"$DIR/hermes_api.py\" \"Your prompt here\""
echo "================================================================"

