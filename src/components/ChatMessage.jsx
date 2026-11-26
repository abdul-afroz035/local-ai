import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';
import { copyToClipboard, parseMarkdownBlocks } from '../lib/markdown';
import CodeBlock from './CodeBlock';

const ChatMessage = memo(function ChatMessage({
  message,
  messageIndex,
  isLatestAssistant,
  isStreaming,
  isAnyGenerating,
  onRegenerate,
  onEditMessage,
  onSelectVersion,
  onFeedback,
  onOpenArtifact,
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content || '');
  const editTextareaRef = useRef(null);

  const feedback = message.feedback || null;
  const versions = message.versions || null;
  const activeVersion = typeof message.activeVersion === 'number' ? message.activeVersion : 0;
  const totalVersions = versions ? versions.length : 1;

  // Sync edit value when message content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(message.content || '');
    }
  }, [message.content, isEditing]);

  // Auto-focus & auto-size edit textarea
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.focus();
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
    }
  }, [isEditing, editValue]);

  const activeStreaming = Boolean(isStreaming && isLatestAssistant);

  // Parse markdown into alternating HTML prose blocks & React CodeBlock components
  const blocks = useMemo(() => {
    if (isUser) return [];
    return parseMarkdownBlocks(message.content, activeStreaming);
  }, [isUser, message.content, activeStreaming]);

  const handleCopyResponse = async () => {
    const ok = await copyToClipboard(message.content || '');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || isAnyGenerating) return;
    setIsEditing(false);
    if (trimmed !== message.content && onEditMessage) {
      onEditMessage(messageIndex, trimmed);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(message.content || '');
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <div
      className={`group w-full flex gap-3.5 ${
        isUser ? 'justify-end' : 'justify-start'
      } animate-fadeIn`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-claude-coral flex items-center justify-center text-white shrink-0 shadow-md shadow-claude-coral/25 mt-0.5">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
      )}

      {/* Message Body */}
      <div
        className={`flex flex-col min-w-0 ${
          isUser
            ? isEditing
              ? 'w-full max-w-2xl items-end'
              : 'items-end max-w-[88%] md:max-w-[78%]'
            : 'flex-1 max-w-full'
        }`}
      >
        {isUser ? (
          isEditing ? (
            <div className="w-full p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-claude-coral/50 shadow-sm space-y-2.5">
              <textarea
                ref={editTextareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={2}
                className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none focus:outline-none"
                placeholder="Edit your message..."
              />
              <div className="flex items-center justify-between pt-1 border-t border-light-border dark:border-dark-border">
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  Enter to save & regenerate • Esc to cancel
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(message.content || '');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editValue.trim() || isAnyGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-claude-coral hover:bg-claude-coral-hover disabled:opacity-50 text-white transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Save & Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1 max-w-full">
              <div className="px-4 py-2.5 rounded-2xl bg-light-msg dark:bg-dark-msg border border-light-border dark:border-dark-border text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm">
                {message.content}
              </div>

              {/* User message Edit action (accessible on mobile & hover on desktop) */}
              {!isAnyGenerating && onEditMessage && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                    title="Edit message"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="w-full min-w-0 text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed">
            {/* Thinking indicator before first token */}
            {activeStreaming && !message.content ? (
              <div className="flex items-center gap-2 py-2 text-xs text-neutral-400">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-claude-coral animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-claude-coral animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-claude-coral animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>Generating response...</span>
              </div>
            ) : (
              <div className="prose-chat break-words">
                {blocks.map((block, i) =>
                  block.type === 'code' ? (
                    <CodeBlock
                      key={`code-${i}`}
                      code={block.code}
                      lang={block.lang}
                      isComplete={block.isComplete}
                      onOpenArtifact={onOpenArtifact}
                    />
                  ) : (
                    <div
                      key={`html-${i}`}
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  )
                )}
                {activeStreaming && <span className="streaming-cursor" />}
              </div>
            )}

            {/* Assistant Action Toolbar */}
            {!activeStreaming && message.content && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1 text-xs text-neutral-400 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                {/* Copy Full Response (Markdown preserved) */}
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  title="Copy complete response (Markdown)"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Regenerate Response */}
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={() => onRegenerate(messageIndex)}
                    disabled={isAnyGenerating}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                )}

                {/* Version Switcher (< 1 / 2 >) */}
                {totalVersions > 1 && onSelectVersion && (
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[11px] font-medium text-neutral-500 dark:text-neutral-300">
                    <button
                      type="button"
                      disabled={activeVersion <= 0 || isAnyGenerating}
                      onClick={() => onSelectVersion(messageIndex, activeVersion - 1)}
                      className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                      title="Previous version"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1 tabular-nums">
                      {activeVersion + 1} / {totalVersions}
                    </span>
                    <button
                      type="button"
                      disabled={activeVersion >= totalVersions - 1 || isAnyGenerating}
                      onClick={() => onSelectVersion(messageIndex, activeVersion + 1)}
                      className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                      title="Next version"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Like / Dislike Feedback */}
                <div className="flex items-center gap-0.5 ml-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onFeedback && onFeedback(message.id, feedback === 'up' ? null : 'up')
                    }
                    className={`p-1.5 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors ${
                      feedback === 'up'
                        ? 'text-claude-coral bg-claude-coral/10'
                        : 'hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFeedback && onFeedback(message.id, feedback === 'down' ? null : 'down')
                    }
                    className={`p-1.5 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors ${
                      feedback === 'down'
                        ? 'text-claude-coral bg-claude-coral/10'
                        : 'hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {message.stopped && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Stopped
                  </span>
                )}

                <span className="ml-auto text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                  Apple Metal GPU
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;
