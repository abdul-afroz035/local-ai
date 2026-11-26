import React, { memo, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { copyToClipboard, escapeHtml, highlightCode } from '../lib/markdown';

const CodeBlock = memo(function CodeBlock({
  code,
  lang,
  isComplete = true,
  onOpenArtifact,
}) {
  const [copied, setCopied] = useState(false);

  // Only run syntax highlighting once the code block is complete to avoid
  // expensive re-highlighting on every streaming token.
  const highlighted = useMemo(() => {
    if (!isComplete) {
      return {
        html: escapeHtml(code),
        language: lang || 'Code',
      };
    }
    return highlightCode(code, lang);
  }, [code, lang, isComplete]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#141413] text-neutral-100 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#1e1e1c] border-b border-white/10 text-xs text-neutral-400 select-none">
        <span className="font-mono text-[11px] font-semibold tracking-wide uppercase text-neutral-300">
          {highlighted.language}
        </span>

        <div className="flex items-center gap-1.5">
          {onOpenArtifact && (
            <button
              type="button"
              onClick={() => onOpenArtifact(`${highlighted.language} Snippet`, code)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Open in Artifact drawer"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Artifact</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto p-3.5 text-[13px] leading-relaxed font-mono">
        <pre className="m-0 bg-transparent border-0 p-0">
          <code
            className="hljs bg-transparent p-0 block whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlighted.html }}
          />
        </pre>
      </div>
    </div>
  );
});

export default CodeBlock;
