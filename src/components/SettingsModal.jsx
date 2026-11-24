import React, { useState, useEffect } from 'react';
import { X, Server, Sparkles, Sliders, Check, ShieldAlert, Cpu, Globe } from 'lucide-react';
import { ACTIVE_TUNNEL_URL, SYSTEM_PROMPTS } from '../lib/config';

export function SettingsModal({
  isOpen,
  onClose,
  backendUrl,
  onSaveBackendUrl,
  activeModel,
  onSaveModel,
  models,
  systemPrompt,
  onSaveSystemPrompt,
  onRefreshModels
}) {
  const [url, setUrl] = useState(backendUrl || '');
  const [model, setModel] = useState(activeModel || '');
  const [prompt, setPrompt] = useState(systemPrompt || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setUrl(backendUrl || '');
  }, [backendUrl]);

  useEffect(() => {
    setModel(activeModel || '');
  }, [activeModel]);

  useEffect(() => {
    setPrompt(systemPrompt || '');
  }, [systemPrompt]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveBackendUrl(url.trim());
    if (model) onSaveModel(model);
    onSaveSystemPrompt(prompt);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-claude-bg dark:bg-claude-dark-surface rounded-2xl border border-claude-border dark:border-claude-dark-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-claude-border dark:border-claude-dark-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-claude-accent" />
            <h2 className="text-lg font-serif font-medium text-claude-text dark:text-claude-dark-text">
              Platform Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-claude-muted hover:text-claude-text dark:hover:text-claude-dark-text rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* API Gateway URL */}
          <div className="space-y-2">
            <label className="flex items-center justify-between font-medium text-claude-text dark:text-claude-dark-text">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-claude-muted" />
                API Gateway / Ollama URL
              </span>
              <button
                type="button"
                onClick={onRefreshModels}
                className="text-xs text-claude-accent hover:underline flex items-center gap-1"
              >
                Test & Refresh Models
              </button>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... or http://127.0.0.1:11434"
              className="w-full px-3.5 py-2.5 rounded-xl border border-claude-border dark:border-claude-dark-border bg-claude-surface dark:bg-claude-dark-bg text-claude-text dark:text-claude-dark-text focus:outline-none focus:ring-2 focus:ring-claude-accent/30 font-mono text-xs"
            />
            
            {/* Quick URL presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUrl(ACTIVE_TUNNEL_URL)}
                className="text-xs px-2.5 py-1 rounded-lg bg-claude-accent/10 hover:bg-claude-accent/20 text-claude-accent border border-claude-accent/20 transition-colors flex items-center gap-1.5"
              >
                <Globe className="w-3 h-3" />
                Active Cloudflare Tunnel
              </button>
              <button
                type="button"
                onClick={() => setUrl('http://127.0.0.1:11434')}
                className="text-xs px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-claude-muted dark:text-claude-dark-muted border border-claude-border dark:border-claude-dark-border transition-colors flex items-center gap-1.5"
              >
                <Cpu className="w-3 h-3" />
                Localhost (127.0.0.1:11434)
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-medium text-claude-text dark:text-claude-dark-text">
              <Cpu className="w-4 h-4 text-claude-muted" />
              Active LLM Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-claude-border dark:border-claude-dark-border bg-claude-surface dark:bg-claude-dark-bg text-claude-text dark:text-claude-dark-text focus:outline-none focus:ring-2 focus:ring-claude-accent/30 text-xs font-mono"
            >
              {models && models.length > 0 ? (
                models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ''}
                  </option>
                ))
              ) : (
                <option value={model || 'llama3-abliterated:latest'}>
                  {model || 'llama3-abliterated:latest (Default)'}
                </option>
              )}
            </select>
            <p className="text-xs text-claude-muted dark:text-claude-dark-muted">
              Models are populated directly from your local Ollama instance with Apple Metal GPU acceleration.
            </p>
          </div>

          {/* System Prompt Customization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-medium text-claude-text dark:text-claude-dark-text">
                <Sparkles className="w-4 h-4 text-claude-accent" />
                System Persona & Directives
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPrompt(SYSTEM_PROMPTS.HERMES)}
                  className="text-[11px] px-2 py-0.5 rounded bg-claude-coral/10 hover:bg-claude-coral/20 text-claude-coral border border-claude-coral/30 font-medium transition-colors"
                >
                  Hermes Agent
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt(SYSTEM_PROMPTS.UNRESTRICTED)}
                  className="text-[11px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 text-claude-muted hover:text-claude-text dark:hover:text-claude-dark-text transition-colors"
                >
                  Uncensored
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt(SYSTEM_PROMPTS.CODER)}
                  className="text-[11px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 text-claude-muted hover:text-claude-text dark:hover:text-claude-dark-text transition-colors"
                >
                  Architect
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt(SYSTEM_PROMPTS.CONCISE)}
                  className="text-[11px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 text-claude-muted hover:text-claude-text dark:hover:text-claude-dark-text transition-colors"
                >
                  Concise
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-claude-border dark:border-claude-dark-border bg-claude-surface dark:bg-claude-dark-bg text-claude-text dark:text-claude-dark-text focus:outline-none focus:ring-2 focus:ring-claude-accent/30 text-xs font-mono resize-none leading-relaxed"
            />
          </div>

          {/* Unrestricted Notice */}
          <div className="p-3 rounded-xl bg-claude-accent/5 border border-claude-accent/15 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-claude-accent shrink-0 mt-0.5" />
            <div className="text-xs text-claude-muted dark:text-claude-dark-muted leading-relaxed">
              <span className="font-semibold text-claude-text dark:text-claude-dark-text">Direct Ollama Integration:</span> Requests execute entirely on your private hardware. Zero logs or tokens leave your network unless proxied through the encrypted Cloudflare tunnel.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-claude-muted hover:text-claude-text dark:hover:text-claude-dark-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-claude-accent hover:bg-claude-accentHover text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
