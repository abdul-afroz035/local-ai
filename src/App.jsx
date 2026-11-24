import React, { useState, useEffect, useRef } from 'react';
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

  // Active generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

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
    } else {
      root.classList.remove('dark');
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
  const refreshBackendModels = async () => {
    const fetched = await fetchModels(backendUrl);
    if (fetched && fetched.length > 0) {
      setModels(fetched);
      setIsOnline(true);
      const exists = fetched.some((m) => m.name === activeModel);
      if (!exists && fetched[0]) {
        setActiveModel(fetched[0].name);
        CONFIG.setModel(fetched[0].name);
      }
    } else {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    refreshBackendModels();
    const interval = setInterval(refreshBackendModels, 30000);
    return () => clearInterval(interval);
  }, [backendUrl]);

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
  }, []);

  // Active session object
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;
  const currentMessages = currentSession?.messages || [];

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isGenerating]);

  // Handlers
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
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
  };

  const handleSelectSession = (id) => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
    setCurrentSessionId(id);
    setIsMobileSidebarOpen(false);
  };

  const handleRenameSession = (id, newTitle) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handlePromptRename = () => {
    if (!currentSession) return;
    const nextTitle = window.prompt('Rename conversation:', currentSession.title);
    if (nextTitle && nextTitle.trim()) {
      handleRenameSession(currentSession.id, nextTitle.trim());
    }
  };

  const handleDeleteSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSaveBackendUrl = (newUrl) => {
    CONFIG.setBackendUrl(newUrl);
    setBackendUrl(newUrl);
    refreshBackendModels();
  };

  const handleSaveModel = (newModel) => {
    CONFIG.setModel(newModel);
    setActiveModel(newModel);
  };

  const handleSaveSystemPrompt = (newPrompt) => {
    CONFIG.setSystemPrompt(newPrompt);
    setSystemPrompt(newPrompt);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Submit prompt / message
  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text || !text.trim() || isGenerating) return;

    let targetSessionId = currentSessionId;
    let updatedSessions = [...sessions];

    // Create session if none active
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

    // Auto-update title if it's the first message
    const isFirstMessage = updatedSessions[sessionIndex].messages.length === 0;
    if (isFirstMessage) {
      updatedSessions[sessionIndex].title = text.slice(0, 36).trim() || 'New Chat';
    }

    // AI placeholder message for streaming
    const aiMsgId = 'msg_ai_' + (Date.now() + 1);
    const aiMsg = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    updatedSessions[sessionIndex] = {
      ...updatedSessions[sessionIndex],
      updatedAt: new Date().toISOString(),
      messages: [...updatedSessions[sessionIndex].messages, userMsg, aiMsg],
    };

    setSessions(updatedSessions);
    setInput('');
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build payload messages including system prompt
    const history = updatedSessions[sessionIndex].messages
      .slice(0, -1)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const apiMessages = [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPTS.unrestricted },
      ...history,
    ];

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
              const targetAiIdx = msgs.findIndex((m) => m.id === aiMsgId);
              if (targetAiIdx !== -1) {
                msgs[targetAiIdx] = {
                  ...msgs[targetAiIdx],
                  content: msgs[targetAiIdx].content + chunkText,
                };
              }
              return { ...s, messages: msgs };
            })
          );
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            const msgs = [...s.messages];
            const targetAiIdx = msgs.findIndex((m) => m.id === aiMsgId);
            if (targetAiIdx !== -1) {
              msgs[targetAiIdx] = {
                ...msgs[targetAiIdx],
                content:
                  msgs[targetAiIdx].content ||
                  `⚠️ Error: Could not reach Ollama at ${backendUrl}. Ensure local Ollama or the Cloudflare tunnel is active.`,
              };
            }
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = (msgIndex) => {
    if (!currentSession || isGenerating) return;
    const targetIdx = msgIndex - 1;
    if (targetIdx >= 0 && currentSession.messages[targetIdx]?.role === 'user') {
      const userText = currentSession.messages[targetIdx].content;
      const truncated = currentSession.messages.slice(0, targetIdx);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id ? { ...s, messages: truncated } : s
        )
      );
      handleSendMessage(userText);
    }
  };

  const handleOpenArtifact = (code) => {
    setArtifact({
      isOpen: true,
      title: 'Code Artifact',
      code,
    });
  };

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
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          {currentMessages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {currentMessages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  message={msg}
                  isLatestAssistant={idx === currentMessages.length - 1 && msg.role === 'assistant'}
                  isStreaming={isGenerating && idx === currentMessages.length - 1 && msg.role === 'assistant'}
                  onRegenerate={() => handleRegenerate(idx)}
                  onOpenArtifact={handleOpenArtifact}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
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
