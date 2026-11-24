/**
 * API client for Ollama and Cloudflare Gateway
 * Supports both OpenAI-compatible (/v1/chat/completions, /v1/models)
 * and native Ollama (/api/chat, /api/tags) endpoints with streaming.
 */

export async function fetchModels(baseUrl) {
  if (!baseUrl) return [];
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  // 1. Try native Ollama /api/tags first
  try {
    const res = await fetch(`${cleanUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.models) && data.models.length > 0) {
        return data.models.map((m) => ({
          id: m.name || m.model,
          name: m.name || m.model,
          details: m.details || {}
        }));
      }
    }
  } catch (e) {
    // Fall back to /v1/models
  }

  // 2. Try OpenAI-compatible /v1/models
  try {
    const res = await fetch(`${cleanUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.data || data?.models || [];
      return list.map((m) => ({
        id: m.id || m.name,
        name: m.id || m.name,
        details: m.details || {}
      }));
    }
  } catch (e) {
    // Ignore error
  }

  return [];
}

/**
 * Universal streaming chat completion
 * Supports both positional args:
 *   streamChatCompletion(baseUrl, model, messages, onChunk, signal)
 * and object arg:
 *   streamChatCompletion({ baseUrl, model, messages, onChunk, signal })
 */
export async function streamChatCompletion(...args) {
  let baseUrl, model, messages, onChunk, signal;

  if (typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0]) && !(args[0] instanceof AbortSignal)) {
    // Called with single config object
    const opt = args[0];
    baseUrl = opt.baseUrl;
    model = opt.model;
    messages = opt.messages || [];
    onChunk = opt.onChunk || opt.onDelta;
    signal = opt.signal;
  } else {
    // Called with positional arguments
    baseUrl = args[0];
    model = args[1];
    messages = args[2] || [];
    onChunk = args[3];
    signal = args[4];
  }

  if (!baseUrl) {
    throw new Error('API Gateway URL is required.');
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const activeModel = model || 'llama3-abliterated:latest';

  // Primary: Native Ollama /api/chat (Most reliable for local & tunnel streaming)
  try {
    const ollamaPayload = {
      model: activeModel,
      messages: messages,
      stream: true,
      options: {
        temperature: 0.7
      }
    };

    const res = await fetch(`${cleanUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ollamaPayload),
      signal
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const token = parsed.message?.content || parsed.response || '';
            if (token && onChunk) {
              onChunk(token);
            }
          } catch (err) {
            // non-JSON fragment
          }
        }
      }
      return;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('/api/chat failed, attempting /v1/chat/completions fallback...', err);
  }

  // Fallback: OpenAI-compatible /v1/chat/completions
  const openAiPayload = {
    model: activeModel,
    messages: messages,
    stream: true,
    temperature: 0.7
  };

  const res = await fetch(`${cleanUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(openAiPayload),
    signal
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported by response body.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const token = json.choices?.[0]?.delta?.content || '';
          if (token && onChunk) {
            onChunk(token);
          }
        } catch (e) {
          // ignore parse errors on malformed chunks
        }
      }
    }
  }
}
