"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ChatMessage {
  id: string;
  username: string;
  initials: string;
  text: string;
  timestamp: Date;
  color: string;
}

const AVATAR_COLORS = [
  "#ff2d55",
  "#00d4ff",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    username: "Sarah Chen",
    initials: "SC",
    text: "Excited for the stream to start! 🎬",
    timestamp: new Date(Date.now() - 300_000),
    color: pickColor("Sarah Chen"),
  },
  {
    id: "2",
    username: "Alex Rivera",
    initials: "AR",
    text: "The production quality on these events is always top notch",
    timestamp: new Date(Date.now() - 240_000),
    color: pickColor("Alex Rivera"),
  },
  {
    id: "3",
    username: "Jordan Liu",
    initials: "JL",
    text: "Anyone know what cameras they're using?",
    timestamp: new Date(Date.now() - 180_000),
    color: pickColor("Jordan Liu"),
  },
  {
    id: "4",
    username: "Mika Osman",
    initials: "MO",
    text: "First time catching one of these live — the countdown is so cool",
    timestamp: new Date(Date.now() - 60_000),
    color: pickColor("Mika Osman"),
  },
];

export default function LiveChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      username: "You",
      initials: "YO",
      text: trimmed,
      timestamp: new Date(),
      color: pickColor("You"),
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="glass-surface flex flex-col h-full max-h-[520px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="live-badge text-xs">LIVE</span>
        <h3 className="font-display text-lg tracking-wider text-[var(--text-strong)]">
          LIVE CHAT
        </h3>
        <span className="ml-auto text-xs text-[var(--text-dim)]">
          {messages.length} messages
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 group">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: msg.color }}
              aria-hidden="true"
            >
              {msg.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-[var(--text-strong)] truncate">
                  {msg.username}
                </span>
                <span className="text-xs text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed break-words">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            aria-label="Chat message input"
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--bg-0)] text-[var(--text-strong)] placeholder-[var(--text-dim)] border border-[var(--border-subtle)] focus:border-[var(--accent-signal)] focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--accent-signal)] text-[var(--bg-0)] disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
