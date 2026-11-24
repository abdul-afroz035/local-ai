import React from 'react';
import { PanelLeft, Sparkles, Plus, Settings } from 'lucide-react';

export default function Header({
  isSidebarCollapsed,
  onToggleSidebar,
  chatTitle,
  onRenameTitle,
  activeModel,
  onOpenSettings,
  onNewChat
}) {
  return (
    <header className="h-14 border-b border-light-border dark:border-dark-border px-4 flex items-center justify-between bg-light-app dark:bg-dark-app shrink-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <h1 
          onClick={onRenameTitle}
          className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs md:max-w-md cursor-pointer hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover px-2 py-1 rounded-md transition-colors"
          title="Click to rename"
        >
          {chatTitle || 'New Chat'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Model Badge */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-claude-coral/10 hover:bg-claude-coral/20 text-claude-coral border border-claude-coral/30 transition-all shadow-sm"
          title="Change active model or gateway"
        >
          <Sparkles className="w-3 h-3 fill-claude-coral" />
          <span className="truncate max-w-[140px] md:max-w-[200px]">{activeModel}</span>
        </button>

        <button
          onClick={onNewChat}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors md:hidden"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
