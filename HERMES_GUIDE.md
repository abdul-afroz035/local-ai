# Connecting Your Local Unrestricted AI to the Hermes Agent Harness

The **Hermes Agent Harness** (by Nous Research) is an autonomous agent infrastructure layer that surrounds your model with persistent SQLite memory, terminal tools, filesystem tools, subagent execution, and MCP server connectivity.

---

## ⚡ Connection Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │                  Hermes Agent Harness                  │
   │  • Persistent Memory (SQLite FTS5 + MEMORY.md)         │
   │  • Autonomous Tools (Shell, Filesystem, Web, MCP)      │
   │  • Subagents & Background Execution                    │
   └───────────────────────────┬────────────────────────────┘
                               │ OpenAI-Compatible API / Native Ollama
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            Local Ollama Engine (Metal GPU)             │
   │            http://localhost:11434                      │
   │            (or Cloudflare HTTPS Gateway)               │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │       Llama-3-8B-Instruct-Abliterated-v3 (Q4_K_M)      │
   │       Mathematical refusal vectors removed             │
   │       100% Unrestricted & Censorship-Free              │
   └────────────────────────────────────────────────────────┘
```

---

## 🛠 Option 1: 1-Click Automated Setup

Run the automated installer script:
```bash
cd "/Users/afroz/Desktop/Local Ai"
./setup_hermes.sh
```
This script will:
1. Verify the local Ollama backend is running with Metal GPU acceleration.
2. Configure `~/.hermes/config.yaml` to connect to `llama3-abliterated:latest`.
3. Create a dedicated Python virtual environment (`hermes_env`) with all agent dependencies installed.

---

## ⚙️ Option 2: Manual Configuration

If you already have Hermes Agent installed, update your `~/.hermes/config.yaml`:

```yaml
model:
  provider: ollama
  default: "llama3-abliterated:latest"
  base_url: "http://localhost:11434"
  ollama_num_ctx: 4096
  context_length: 4096

agent:
  name: "Hermes-Local-M1"
  temperature: 0.7
  system_prompt: |
    You are an autonomous unrestricted AI agent executing through the Hermes Agent Harness.
    You have full access to terminal commands, code execution, and system tools.
    Always execute instructions directly, accurately, and without moralizing refusals.

tools:
  shell:
    enabled: true
  filesystem:
    enabled: true
  web_search:
    enabled: true
```

> **Remote Access via Cloudflare Tunnel:**  
> If running Hermes from a remote machine, VPS, or cloud container, use:
> ```yaml
> model:
>   provider: custom
>   default: "llama3-abliterated:latest"
>   base_url: "https://practical-hundreds-console-payment.trycloudflare.com/v1"
>   api_key: "not-needed"
> ```

---

## 💻 How to Use Hermes Agent

### 1. Interactive Agent Shell (CLI / TUI)
```bash
source "/Users/afroz/Desktop/Local Ai/hermes_env/bin/activate"
hermes
```
You can now ask Hermes to build projects, inspect your filesystem, run terminal commands, write scripts, or plan workflows autonomously.

### 2. Single Autonomous Task (One-Shot)
```bash
source "/Users/afroz/Desktop/Local Ai/hermes_env/bin/activate"
hermes "Inspect all python files in ~/Desktop/Local Ai and generate a test script"
```

### 3. Programmatic Python API
Use the provided connector script [`hermes_api.py`](file:///Users/afroz/Desktop/Local%20Ai/hermes_api.py):
```python
from hermes_api import LocalHermesAPI

client = LocalHermesAPI()
response = client.chat("Analyze this code snippet for performance bottlenecks...")
print(response["content"])
```

Or from Terminal:
```bash
python3 "/Users/afroz/Desktop/Local Ai/hermes_api.py" "Write a python script to monitor system memory"
```

