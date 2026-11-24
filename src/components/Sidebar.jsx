import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  X, 
  MessageSquare, 
  Pencil, 
  Trash2, 
  Sun, 
  Moon, 
  Settings, 
  PanelLeftClose, 
  Cpu 
} from 'lucide-react';
import { categorizeTimestamp } from '../lib/config';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  theme,
  onToggleTheme,
  onOpenSettings,
  isOnline
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (s.title || '').toLowerCase().includes(q);
    const msgMatch = (s.messages || []).some(m => (m.content || '').toLowerCase().includes(q));
    return titleMatch || msgMatch;
  });

  const groups = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  filteredSessions.forEach(sess => {
    const cat = categorizeTimestamp(sess.createdAt || sess.updatedAt || Date.now());
    if (groups[cat]) groups[cat].push(sess);
    else groups['Older'].push(sess);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        flex flex-col h-screen
        bg-light-sidebar dark:bg-dark-sidebar
        border-r border-light-border dark:border-dark-border
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:w-0 md:border-r-0 md:-translate-x-full overflow-hidden' : 'w-72 md:w-72 md:translate-x-0'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Section */}
        <div className="p-4 flex flex-col gap-3 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-claude-coral to-amber-600 flex items-center justify-center text-white shadow-sm shadow-claude-coral/30">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <span>Local AI</span>
            </div>
            
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
              title="Close sidebar (⌘B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-claude-coral/50 text-neutral-900 dark:text-neutral-100 text-sm font-medium shadow-sm transition-all hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-claude-coral" />
              <span>New chat</span>
            </div>
            <kbd className="text-[10px] text-neutral-400 border border-neutral-300 dark:border-neutral-700 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
              ⌘K
            </kbd>
          </button>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-claude-coral transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Chat History Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-400">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            Object.entries(groups).map(([groupName, groupList]) => {
              if (groupList.length === 0) return null;
              return (
                <div key={groupName} className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2.5 py-1">
                    {groupName}
                  </div>
                  <div className="space-y-0.5">
                    {groupList.map(sess => {
                      const isActive = sess.id === currentSessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => onSelectSession(sess.id)}
                          className={`
                            group flex items-center justify-between px-2.5 py-2 rounded-lg text-sm cursor-pointer transition-all
                            ${isActive 
                              ? 'bg-claude-coral/15 text-claude-coral font-medium' 
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-neutral-900 dark:hover:text-neutral-100'}
                          `}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-claude-coral' : 'text-neutral-400'}`} />
                            <span className="truncate text-[13px]">{sess.title || 'New Chat'}</span>
                          </div>

                          <div className={`items-center gap-1 shrink-0 ${isActive ? 'flex' : 'hidden group-hover:flex'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Rename conversation:', sess.title);
                                if (newTitle && newTitle.trim()) onRenameSession(sess.id, newTitle.trim());
                              }}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                              title="Rename"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(sess.id);
                              }}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-light-border dark:border-dark-border space-y-3 bg-light-sidebar dark:bg-dark-sidebar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center text-xs font-semibold text-claude-coral">
                AU
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Local User</span>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Apple Metal M1
                </span>
              </div>
            </div>

            {/* Online Status Pill */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500'}`} />
              <span className="text-neutral-500 dark:text-neutral-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
              title="Settings & Gateway"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
