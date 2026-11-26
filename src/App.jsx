import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { CONFIG, SYSTEM_PROMPTS } from './lib/config';
import { fetchModels, streamChatCompletion } from './lib/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ArtifactDrawer from './components/ArtifactDrawer';
import { SettingsModal } from './components/SettingsModal';

const SESSIONS_KEY = 'claude_ai_sessions_v2';
const ACTIVE_SESSION_ID_KEY = 'claude_ai_active_session_id';

export function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('claude_theme') || 'dark';
  });

  // Layout & Modal state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Gateway & Model state
  const [backendUrl, setBackendUrl] = useState(() => CONFIG.getBackendUrl());
  const [activeModel, setActiveModel] = useState(() => CONFIG.getModel());
  const [systemPrompt, setSystemPrompt] = useState(() => CONFIG.getSystemPrompt());
  const [models, setModels] = useState([]);
  const [isOnline, setIsOnline] = useState(false);

  // Input composer state
  const [input, setInput] = useState('');

  // Chat Sessions state
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse sessions from storage', e);
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY) || null;
  });

  // Active generating state & refs
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const abortControllerRef = useRef(null);
  const activeStreamingRef = useRef({ sessionId: null, msgId: null });
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Artifact Drawer state
  const [artifact, setArtifact] = useState({
    isOpen: false,
    title: '',
    code: '',
  });

  // Sync theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('claude_theme', theme);
  }, [theme]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Persist active session id
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, currentSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    }
  }, [currentSessionId]);

  // Fetch models & check backend status
  const refreshBackendModels = useCallback(async () => {
    const fetched = await fetchModels(backendUrl);
    if (fetched && fetched.length > 0) {
      setModels(fetched);
      setIsOnline(true);
      const exists = fetched.some((m) => m.name === activeModel || m.id === activeModel);
      if (!exists && fetched[0]) {
        const firstModel = fetched[0].name || fetched[0].id;
        setActiveModel(firstModel);
        CONFIG.setModel(firstModel);
      }
    } else {
      setIsOnline(false);
    }
  }, [backendUrl, activeModel]);

  useEffect(() => {
    refreshBackendModels();
    const interval = setInterval(refreshBackendModels, 30000);
    return () => clearInterval(interval);
  }, [refreshBackendModels]);

  // Active session object
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;
  const currentMessages = currentSession?.messages || [];

  // Smart scroll handler: track whether user manually scrolled upward
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 90;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom && el.scrollHeight > el.clientHeight + 100);
  }, []);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = true;
    setShowScrollButton(false);
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Auto-scroll only when user is already near the bottom
  useEffect(() => {
    if (isNearBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [currentMessages, isGenerating]);

  // Reset scroll position to bottom when switching sessions
  useEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollButton(false);
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    });
  }, [currentSessionId]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const { sessionId, msgId } = activeStreamingRef.current;
    if (sessionId && msgId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === msgId ? { ...m, stopped: true } : m
            ),
          };
        })
      );
    }
    activeStreamingRef.current = { sessionId: null, msgId: null };
    setIsGenerating(false);
  }, []);

  const handleNewChat = useCallback(() => {
    if (isGenerating) {
      handleStopGeneration();
    }
    const newSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, [isGenerating, handleStopGeneration]);

  // Keyboard shortcuts (⌘K for New Chat, ⌘B for toggle sidebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSelectSession = useCallback(
    (id) => {
      if (isGenerating) {
        handleStopGeneration();
      }
      setCurrentSessionId(id);
      setIsMobileSidebarOpen(false);
    },
    [isGenerating, handleStopGeneration]
  );

  const handleRenameSession = useCallback((id, newTitle) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  }, []);

  const handlePromptRename = useCallback(() => {
    if (!currentSession) return;
    const nextTitle = window.prompt('Rename conversation:', currentSession.title);
    if (nextTitle && nextTitle.trim()) {
      handleRenameSession(currentSession.id, nextTitle.trim());
    }
  }, [currentSession, handleRenameSession]);

  const handleDeleteSession = useCallback(
    (id) => {
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        if (currentSessionId === id) {
          setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    },
    [currentSessionId]
  );

  const handleSaveBackendUrl = useCallback((newUrl) => {
    CONFIG.setBackendUrl(newUrl);
    setBackendUrl(newUrl);
  }, []);

  const handleSaveModel = useCallback((newModel) => {
    CONFIG.setModel(newModel);
    setActiveModel(newModel);
  }, []);

  const handleSaveSystemPrompt = useCallback((newPrompt) => {
    CONFIG.setSystemPrompt(newPrompt);
    setSystemPrompt(newPrompt);
  }, []);

  /**
   * Shared streaming execution helper used by Send, Regenerate, and Edit Message.
   */
  const executeStreamCompletion = useCallback(
    async (targetSessionId, aiMsgId, apiMessages) => {
      setIsGenerating(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      activeStreamingRef.current = { sessionId: targetSessionId, msgId: aiMsgId };

      try {
        await streamChatCompletion(
          backendUrl,
          activeModel,
          apiMessages,
          (chunkText) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== targetSessionId) return s;
                const msgs = [...s.messages];
                const idx = msgs.findIndex((m) => m.id === aiMsgId);
                if (idx !== -1) {
                  const current = msgs[idx];
                  const nextContent = (current.content || '') + chunkText;
                  let nextVersions = current.versions;
                  if (Array.isArray(nextVersions)) {
                    const verIdx =
                      typeof current.activeVersion === 'number'
                        ? current.activeVersion
                        : nextVersions.length - 1;
                    nextVersions = [...nextVersions];
                    nextVersions[verIdx] = nextContent;
                  }
                  msgs[idx] = {
                    ...current,
                    content: nextContent,
                    versions: nextVersions,
                  };
                }
                return { ...s, messages: msgs };
              })
            );
          },
          controller.signal
        );
      } catch (err) {
        if (err.name === 'AbortError') {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== targetSessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, stopped: true } : m
                ),
              };
            })
          );
        } else {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== targetSessionId) return s;
              const msgs = [...s.messages];
              const idx = msgs.findIndex((m) => m.id === aiMsgId);
              if (idx !== -1) {
                const errMsg =
                  msgs[idx].content ||
                  `⚠️ Connection Error: ${
                    err.message || 'Could not reach backend at ' + backendUrl
                  }. Check your Gateway URL in Settings (⚙️). If accessing from Vercel, ensure the Cloudflare Tunnel is active.`;
                msgs[idx] = {
                  ...msgs[idx],
                  content: errMsg,
                };
              }
              return { ...s, messages: msgs };
            })
          );
        }
      } finally {
        activeStreamingRef.current = { sessionId: null, msgId: null };
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    },
    [backendUrl, activeModel]
  );

  // Submit new user message
  const handleSendMessage = useCallback(
    async (textToSend) => {
      const text = typeof textToSend === 'string' ? textToSend : input;
      if (!text || !text.trim() || isGenerating) return;

      let targetSessionId = currentSessionId;
      let updatedSessions = [...sessions];

      if (!targetSessionId || !sessions.some((s) => s.id === targetSessionId)) {
        const newSession = {
          id: 'session_' + Date.now(),
          title: text.slice(0, 36).trim() || 'New Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        targetSessionId = newSession.id;
        updatedSessions = [newSession, ...sessions];
        setCurrentSessionId(targetSessionId);
      }

      const sessionIndex = updatedSessions.findIndex((s) => s.id === targetSessionId);
      if (sessionIndex === -1) return;

      const userMsg = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      if (updatedSessions[sessionIndex].messages.length === 0) {
        updatedSessions[sessionIndex].title = text.slice(0, 36).trim() || 'New Chat';
      }

      const aiMsgId = 'msg_ai_' + (Date.now() + 1);
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        versions: [''],
        activeVersion: 0,
        timestamp: new Date().toISOString(),
      };

      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        updatedAt: new Date().toISOString(),
        messages: [...updatedSessions[sessionIndex].messages, userMsg, aiMsg],
      };

      isNearBottomRef.current = true;
      setSessions(updatedSessions);
      setInput('');

      const history = updatedSessions[sessionIndex].messages
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const apiMessages = [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPTS.unrestricted },
        ...history,
      ];

      await executeStreamCompletion(targetSessionId, aiMsgId, apiMessages);
    },
    [input, isGenerating, currentSessionId, sessions, systemPrompt, executeStreamCompletion]
  );

  // Regenerate assistant response (preserves previous versions for < 1 / 2 > switching)
  const handleRegenerate = useCallback(
    async (msgIndex) => {
      if (!currentSession || isGenerating) return;
      const targetMsg = currentSession.messages[msgIndex];
      if (!targetMsg || targetMsg.role !== 'assistant') return;

      // Context includes all messages up to (but excluding) this assistant message
      const contextMessages = currentSession.messages.slice(0, msgIndex);
      if (contextMessages.length === 0) return;

      const existingVersions = Array.isArray(targetMsg.versions)
        ? [...targetMsg.versions]
        : [targetMsg.content || ''];
      const newVersionIdx = existingVersions.length;
      existingVersions.push('');

      const updatedMsg = {
        ...targetMsg,
        content: '',
        stopped: false,
        feedback: null,
        versions: existingVersions,
        activeVersion: newVersionIdx,
        timestamp: new Date().toISOString(),
      };

      // Keep conversation up to this regenerated message
      const nextMessages = [...contextMessages, updatedMsg];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, updatedAt: new Date().toISOString(), messages: nextMessages }
            : s
        )
      );

      const apiMessages = [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPTS.unrestricted },
        ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      await executeStreamCompletion(currentSession.id, updatedMsg.id, apiMessages);
    },
    [currentSession, isGenerating, systemPrompt, executeStreamCompletion]
  );

  // Edit previous user message and regenerate from that point
  const handleEditMessage = useCallback(
    async (msgIndex, newText) => {
      if (!currentSession || isGenerating) return;
      const targetUserMsg = currentSession.messages[msgIndex];
      if (!targetUserMsg || targetUserMsg.role !== 'user') return;

      const priorMessages = currentSession.messages.slice(0, msgIndex);
      const updatedUserMsg = {
        ...targetUserMsg,
        content: newText,
        timestamp: new Date().toISOString(),
      };

      const aiMsgId = 'msg_ai_' + Date.now();
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        versions: [''],
        activeVersion: 0,
        timestamp: new Date().toISOString(),
      };

      const nextMessages = [...priorMessages, updatedUserMsg, aiMsg];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                title: msgIndex === 0 ? newText.slice(0, 36).trim() : s.title,
                updatedAt: new Date().toISOString(),
                messages: nextMessages,
              }
            : s
        )
      );

      const apiMessages = [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPTS.unrestricted },
        ...[...priorMessages, updatedUserMsg].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      await executeStreamCompletion(currentSession.id, aiMsgId, apiMessages);
    },
    [currentSession, isGenerating, systemPrompt, executeStreamCompletion]
  );

  // Switch between regenerated versions of an assistant message
  const handleSelectVersion = useCallback(
    (msgIndex, versionIdx) => {
      if (!currentSession || isGenerating) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSession.id) return s;
          const msgs = [...s.messages];
          const msg = msgs[msgIndex];
          if (!msg || !Array.isArray(msg.versions) || !msg.versions[versionIdx]) {
            return s;
          }
          msgs[msgIndex] = {
            ...msg,
            activeVersion: versionIdx,
            content: msg.versions[versionIdx],
          };
          return { ...s, messages: msgs };
        })
      );
    },
    [currentSession, isGenerating]
  );

  // Persist like/dislike feedback
  const handleFeedback = useCallback(
    (msgId, feedbackValue) => {
      if (!currentSession) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === msgId ? { ...m, feedback: feedbackValue } : m
            ),
          };
        })
      );
    },
    [currentSession]
  );

  const handleOpenArtifact = useCallback((title, code) => {
    setArtifact({
      isOpen: true,
      title: title || 'Code Artifact',
      code: code || '',
    });
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-light-app dark:bg-dark-app text-neutral-900 dark:text-neutral-100 transition-colors duration-200 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          chatTitle={currentSession?.title || 'New Chat'}
          onRenameTitle={handlePromptRename}
          activeModel={activeModel}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={handleNewChat}
        />

        {/* Scrollable Chat Message Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 relative"
        >
          {currentMessages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-6">
              {currentMessages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  message={msg}
                  messageIndex={idx}
                  isLatestAssistant={
                    idx === currentMessages.length - 1 && msg.role === 'assistant'
                  }
                  isStreaming={isGenerating}
                  isAnyGenerating={isGenerating}
                  onRegenerate={handleRegenerate}
                  onEditMessage={handleEditMessage}
                  onSelectVersion={handleSelectVersion}
                  onFeedback={handleFeedback}
                  onOpenArtifact={handleOpenArtifact}
                />
              ))}
            </div>
          )}

          {/* Scroll to bottom floating pill when scrolled up */}
          {showScrollButton && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-lg text-neutral-700 dark:text-neutral-200 hover:border-claude-coral transition-all"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Scroll to bottom</span>
            </button>
          )}
        </div>

        {/* Bottom Composer Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage(input)}
          isGenerating={isGenerating}
          onStop={handleStopGeneration}
        />
      </div>

      {/* Slide-out Artifact Drawer */}
      <ArtifactDrawer
        isOpen={artifact.isOpen}
        title={artifact.title}
        code={artifact.code}
        onClose={() => setArtifact((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendUrl={backendUrl}
        onSaveBackendUrl={handleSaveBackendUrl}
        activeModel={activeModel}
        onSaveModel={handleSaveModel}
        models={models}
        systemPrompt={systemPrompt}
        onSaveSystemPrompt={handleSaveSystemPrompt}
        onRefreshModels={refreshBackendModels}
      />
    </div>
  );
}

export default App;
