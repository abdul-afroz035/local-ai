import { marked } from 'marked';
import katex from 'katex';
import hljs from 'highlight.js/lib/core';

// Register only commonly used languages to keep bundle lean and fast on M1
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import yaml from 'highlight.js/lib/languages/yaml';
import markdownLang from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);

const LANG_ALIASES = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  py3: 'python',
  html: 'xml',
  htm: 'xml',
  svg: 'xml',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  console: 'bash',
  yml: 'yaml',
  md: 'markdown',
  'c++': 'cpp',
  cc: 'cpp',
  cs: 'csharp',
  rb: 'ruby',
  docker: 'dockerfile',
};

const DISPLAY_NAMES = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  xml: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  sql: 'SQL',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  yaml: 'YAML',
  markdown: 'Markdown',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  php: 'PHP',
  ruby: 'Ruby',
};

/**
 * Highlights a code string using registered highlight.js languages.
 * Falls back to auto-detection across registered languages if lang is missing/unknown.
 */
export function highlightCode(code, rawLang = '') {
  const normalized = (rawLang || '').trim().toLowerCase();
  const mappedLang = LANG_ALIASES[normalized] || normalized;

  try {
    if (mappedLang && hljs.getLanguage(mappedLang)) {
      const result = hljs.highlight(code, { language: mappedLang, ignoreIllegals: true });
      return {
        html: result.value,
        language: DISPLAY_NAMES[mappedLang] || rawLang || mappedLang,
      };
    }

    if (normalized === 'text' || normalized === 'plaintext' || normalized === 'txt') {
      return { html: escapeHtml(code), language: 'Text' };
    }

    const auto = hljs.highlightAuto(code);
    const detected = auto.language || '';
    return {
      html: auto.value,
      language: rawLang
        ? rawLang
        : DISPLAY_NAMES[detected] || detected || 'Code',
    };
  } catch {
    return {
      html: escapeHtml(code),
      language: rawLang || 'Code',
    };
  }
}

export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Reliable clipboard copy with fallback for non-HTTPS or older contexts.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// Configure KaTeX extensions for marked so math is parsed before emphasis/underscores
const blockMathExtension = {
  name: 'blockMath',
  level: 'block',
  start(src) {
    const idx = src.search(/\$\$|\\\[/);
    return idx === -1 ? undefined : idx;
  },
  tokenizer(src) {
    const dollarMatch = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
    if (dollarMatch) {
      return {
        type: 'blockMath',
        raw: dollarMatch[0],
        text: dollarMatch[1].trim(),
      };
    }
    const bracketMatch = /^\\\[([\s\S]+?)\\\](?:\n+|$)/.exec(src);
    if (bracketMatch) {
      return {
        type: 'blockMath',
        raw: bracketMatch[0],
        text: bracketMatch[1].trim(),
      };
    }
    return undefined;
  },
  renderer(token) {
    try {
      const rendered = katex.renderToString(token.text, {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="math-block overflow-x-auto py-2">${rendered}</div>`;
    } catch {
      return `<pre><code>${escapeHtml(token.text)}</code></pre>`;
    }
  },
};

const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline',
  start(src) {
    const idx = src.search(/\$|\\\(/);
    return idx === -1 ? undefined : idx;
  },
  tokenizer(src) {
    // Match $...$ without crossing newlines or matching $100 currency
    const dollarMatch = /^\$([^\s$][^$\n]*?[^\s$]|[^\s$])\$(?!\d)/.exec(src);
    if (dollarMatch) {
      return {
        type: 'inlineMath',
        raw: dollarMatch[0],
        text: dollarMatch[1].trim(),
      };
    }
    const parenMatch = /^\\\(([\s\S]+?)\\\)/.exec(src);
    if (parenMatch) {
      return {
        type: 'inlineMath',
        raw: parenMatch[0],
        text: parenMatch[1].trim(),
      };
    }
    return undefined;
  },
  renderer(token) {
    try {
      return katex.renderToString(token.text, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(token.text)}</code>`;
    }
  },
};

// Custom renderer for responsive tables and safe external links
const customRenderer = new marked.Renderer();

customRenderer.table = function (token) {
  const html = marked.Renderer.prototype.table.call(this, token);
  return `<div class="table-wrapper">${html}</div>`;
};

customRenderer.link = function (token) {
  const html = marked.Renderer.prototype.link.call(this, token);
  return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
};

marked.use({
  gfm: true,
  breaks: true,
  renderer: customRenderer,
  extensions: [blockMathExtension, inlineMathExtension],
});

/**
 * Splits a markdown string into alternating HTML prose blocks and React-managed Code blocks.
 * Prevents expensive DOM re-highlighting during token streaming.
 */
export function parseMarkdownBlocks(rawText, isStreaming = false) {
  if (!rawText) return [];

  const tokens = marked.lexer(rawText);
  const blocks = [];
  let proseBuffer = [];

  const flushProse = () => {
    if (proseBuffer.length === 0) return;
    // Preserve token list links property if present
    proseBuffer.links = tokens.links || {};
    const html = marked.parser(proseBuffer);
    if (html) {
      blocks.push({ type: 'html', html });
    }
    proseBuffer = [];
  };

  tokens.forEach((token, idx) => {
    if (token.type === 'code') {
      flushProse();
      const isLast = idx === tokens.length - 1;
      // Check if fenced code block is still open during streaming
      const isUnclosedFence =
        isStreaming &&
        isLast &&
        token.codeBlockStyle !== 'indented' &&
        !/\n(?:```+|~~~+)\s*$/.test(token.raw || '');

      blocks.push({
        type: 'code',
        lang: token.lang || '',
        code: token.text || '',
        isComplete: !isUnclosedFence,
      });
    } else {
      proseBuffer.push(token);
    }
  });

  flushProse();
  return blocks;
}

export { hljs };
