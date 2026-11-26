import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';
import { copyToClipboard, hljs } from '../lib/markdown';

export default function ArtifactDrawer({
  isOpen,
  title,
  code,
  onClose
}) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current && code) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, isOpen]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `artifact_${Date.now()}.txt`;
    a.click();
  };

  return (
    <aside
      className={`
        fixed inset-y-0 right-0 z-50
        w-full md:w-1/2 lg:w-5/12
        bg-light-surface dark:bg-dark-surface
        border-l border-light-border dark:border-dark-border
        shadow-2xl flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-app dark:bg-dark-app">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Code2 className="w-4 h-4 text-claude-coral" />
          <span className="truncate max-w-xs">{title || 'Artifact Preview'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-light-border dark:border-dark-border hover:border-claude-coral text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-light-border dark:border-dark-border hover:border-claude-coral text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto p-4 bg-light-code dark:bg-dark-code font-mono text-xs md:text-sm">
        <pre><code ref={codeRef} className="block whitespace-pre">{code}</code></pre>
      </div>
    </aside>
  );
}
