import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  isGenerating,
  onStop
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        onStop();
      } else {
        onSend();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const snippet = `\n\`\`\`${file.name}\n${content}\n\`\`\`\n`;
      setInput((prev) => (prev ? `${prev}\n` : '') + snippet);
      textareaRef.current?.focus();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl w-11/12 mx-auto mb-4 flex flex-col gap-2">
      <div className="relative rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus-within:border-claude-coral/60 focus-within:ring-2 focus-within:ring-claude-coral/15 transition-all shadow-md p-3 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          rows={1}
          className="w-full bg-transparent resize-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm leading-relaxed min-h-[44px] max-h-[180px]"
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".txt,.py,.js,.html,.css,.json,.md,.csv" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
              title="Attach text or code file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-neutral-400 hidden sm:inline">
              Shift + Return for new line
            </span>
          </div>

          <button
            onClick={() => {
              if (isGenerating) onStop();
              else onSend();
            }}
            disabled={!isGenerating && !input.trim()}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm
              ${isGenerating 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : input.trim() 
                  ? 'bg-claude-coral hover:bg-claude-coral-hover text-white scale-100 shadow-claude-coral/30' 
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'}
            `}
            title={isGenerating ? 'Stop generating' : 'Send message'}
          >
            {isGenerating ? (
              <Square className="w-3.5 h-3.5 fill-white" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        Local AI runs privately with zero moralizing refusal filters on Apple Silicon Metal GPU.
      </div>
    </div>
  );
}
