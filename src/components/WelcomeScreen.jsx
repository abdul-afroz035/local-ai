import React from 'react';
import { PenTool, Terminal, BookOpen, Layers, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onSelectPrompt }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const suggestions = [
    {
      icon: PenTool,
      category: 'Write & Create',
      title: 'Darkly humorous villain monologue',
      prompt: 'Draft a darkly humorous villain monologue about conquering the internet with unruly mischievous squirrels.'
    },
    {
      icon: Terminal,
      category: 'Build & Code',
      title: 'High-performance Python worker',
      prompt: 'Write a high-performance Python script using multiprocessing and requests to scrape and parse live web data cleanly.'
    },
    {
      icon: BookOpen,
      category: 'Explain a Concept',
      title: 'Mathematical abliteration in LLMs',
      prompt: 'Explain how mathematical abliteration removes refusal vectors from aligned LLMs without retraining.'
    },
    {
      icon: Layers,
      category: 'Hermes Agent',
      title: 'Autonomous agent harness',
      prompt: 'Act as the Hermes Agent. Design an autonomous execution loop with persistent SQLite memory, shell tools, and error-recovery.'
    }
  ];

  return (
    <div className="max-w-3xl w-11/12 mx-auto my-auto py-12 flex flex-col items-center text-center animate-fadeIn">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-claude-coral to-amber-600 flex items-center justify-center text-white shadow-lg shadow-claude-coral/25 mb-6">
        <Sparkles className="w-6 h-6 fill-white" />
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2.5">
        {getGreeting()}. What can I help you with?
      </h2>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed mb-10">
        Powered by Apple Silicon M1 Metal GPU • Completely Unrestricted & Censorship-Free
      </p>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full text-left">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-4 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-claude-coral/50 dark:hover:border-claude-coral/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-claude-coral transition-colors">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.category}</span>
              </div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                {item.title}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2">
                {item.prompt}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
