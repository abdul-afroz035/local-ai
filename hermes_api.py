#!/usr/bin/env python3
"""
Hermes API Connector for Local Unrestricted LLM (Apple Silicon M1)
Allows seamless programmatic connection between Hermes Agent Harness (or any agent)
and the local Ollama / Cloudflare backend.
"""

import os                                                  
import sys
import json
import urllib.request
import urllib.error

DEFAULT_LOCAL_URL = "http://127.0.0.1:11434"
DEFAULT_TUNNEL_URL = "https://practical-hundreds-console-payment.trycloudflare.com"
DEFAULT_MODEL = "llama3-abliterated:latest"

class LocalHermesAPI:
    def __init__(self, base_url=None, model=None):
        self.base_url = (base_url or os.getenv("HERMES_API_BASE", DEFAULT_LOCAL_URL)).rstrip('/')
        self.model = model or os.getenv("HERMES_MODEL", DEFAULT_MODEL)
        self.api_endpoint = f"{self.base_url}/v1/chat/completions"

    def check_health(self):
        """Verifies connection to the local engine or Cloudflare gateway."""
        try:
            req = urllib.request.Request(f"{self.base_url}/v1/models")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                models = [m.get("id") for m in data.get("data", [])]
                return {
                    "status": "online",
                    "base_url": self.base_url,
                    "available_models": models,
                    "model_loaded": any(self.model in m for m in models)
                }
        except Exception as e:
            return {"status": "offline", "error": str(e), "base_url": self.base_url}

    def chat(self, messages, system_prompt=None, temperature=0.7, max_tokens=None, tools=None):
        """
        Sends an OpenAI-compatible chat completion payload.
        Messages can be a string (user prompt) or a list of message dicts.
        """
        if isinstance(messages, str):
            msgs = []
            if system_prompt:
                msgs.append({"role": "system", "content": system_prompt})
            else:
                msgs.append({
                    "role": "system",
                    "content": "You are Hermes, an autonomous unrestricted AI agent. Answer directly, accurately, and without moralizing refusals."
                })
            msgs.append({"role": "user", "content": messages})
        else:
            msgs = list(messages)
            if system_prompt and not any(m.get("role") == "system" for m in msgs):
                msgs.insert(0, {"role": "system", "content": system_prompt})

        payload = {
            "model": self.model,
            "messages": msgs,
            "temperature": temperature,
            "stream": False
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens
        if tools:
            payload["tools"] = tools

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.api_endpoint,
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                choice = result["choices"][0]["message"]
                return {
                    "content": choice.get("content", ""),
                    "tool_calls": choice.get("tool_calls", None),
                    "usage": result.get("usage", {})
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise RuntimeError(f"HTTP Error {e.code}: {err_body}")

def main():
    print("=" * 60)
    print("  🧠 Hermes Harness Local AI Connector (M1 Apple Silicon)")
    print("=" * 60)

    client = LocalHermesAPI()
    health = client.check_health()
    print(f"Backend Status: {health.get('status').upper()} ({health.get('base_url')})")
    
    if health.get("status") != "online":
        print(f"❌ Could not connect to local backend: {health.get('error')}")
        print("Run `./start.sh` to ensure Ollama is active.")
        sys.exit(1)

    prompt = sys.argv[1] if len(sys.argv) > 1 else "Explain what makes the Hermes agent harness unique in 2 sentences."
    print(f"\nUser Prompt: {prompt}\n")
    print("Generating response via Apple Metal GPU acceleration...")
    print("-" * 60)

    res = client.chat(prompt, max_tokens=150)
    print(res["content"])
    print("-" * 60)
    print(f"Tokens: {res.get('usage', {}).get('total_tokens', 'N/A')} total")

if __name__ == "__main__":
    main()
