import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Copy, Check, RotateCw, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js';

export default function ChatMessage({
  message,
  isLatestAssistant,
  isStreaming,
  onRegenerate,
  onOpenArtifact
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const contentRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Configure marked for clean HTML
  const getRenderedMarkdown = (raw) => {
    try {
      return marked.parse(raw || '');
    } catch (e) {
      return raw;
    }
  };

  // Process code blocks inside assistant output
  useEffect(() => {
    if (isUser || !contentRef.current) return;

    const preElements = contentRef.current.querySelectorAll('pre');
    preElements.forEach((pre) => {
      if (pre.querySelector('.code-header-bar')) return;

      const codeElem = pre.querySelector('code');
      const codeText = codeElem ? codeElem.innerText : pre.innerText;

      let lang = 'Code';
      if (codeElem) {
        const match = codeElem.className.match(/language-(\w+)/);
        if (match) lang = match[1];
        hljs.highlightElement(codeElem);
      }

      // Create code block header
      const header = document.createElement('div');
      header.className = 'code-header-bar flex items-center justify-between px-3 py-1.5 text-xs bg-black/30 border-b border-white/10 text-neutral-400 font-mono';
      header.innerHTML = `
        <span class="uppercase font-semibold tracking-wider text-[11px]">${lang}</span>
        <div class="flex items-center gap-2">
          <button class="btn-artifact-open inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border border-white/10 hover:border-claude-coral hover:text-white transition-colors">
            <span>✦ Open Artifact</span>
          </button>
          <button class="btn-copy-code inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border border-white/10 hover:border-claude-coral hover:text-white transition-colors">
            <span>Copy</span>
          </button>
        </div>
      `;

      header.querySelector('.btn-copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(codeText);
        const btn = header.querySelector('.btn-copy-code span');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });

      header.querySelector('.btn-artifact-open').addEventListener('click', () => {
        onOpenArtifact(`${lang.toUpperCase()} Snippet`, codeText);
      });

      pre.insertBefore(header, pre.firstChild);
      pre.classList.add('overflow-hidden', 'rounded-lg', 'border', 'border-white/10', 'bg-dark-code', 'my-3');
    });
  }, [message.content, isUser]);

  return (
    <div className={`w-full flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-claude-coral flex items-center justify-center text-white shrink-0 shadow-md shadow-claude-coral/25 mt-0.5">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
      )}

      {/* Message Body */}
      <div className={`flex flex-col ${isUser ? 'items-end max-w-[85%] md:max-w-[75%]' : 'flex-1 max-w-full'}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl bg-light-msg dark:bg-dark-msg border border-light-border dark:border-dark-border text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="w-full text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed">
            <div 
              ref={contentRef}
              className="prose-chat break-words"
              dangerouslySetInnerHTML={{ __html: getRenderedMarkdown(message.content) }}
            />
            {isStreaming && isLatestAssistant && (
              <span className="streaming-cursor" />
            )}

            {/* Assistant Action Toolbar */}
            {(!isStreaming || !isLatestAssistant) && message.content && (
              <div className="flex items-center gap-2 mt-3 pt-1 text-xs text-neutral-400">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  title="Copy full response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                )}

                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                    className={`p-1 rounded hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover ${feedback === 'up' ? 'text-claude-coral' : 'hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                    className={`p-1 rounded hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover ${feedback === 'down' ? 'text-claude-coral' : 'hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="ml-auto text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                  Apple Metal GPU • Unrestricted
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
