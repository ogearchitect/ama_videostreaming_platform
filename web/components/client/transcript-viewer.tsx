"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchVideoTranscript } from "@/lib/api";

interface TranscriptViewerProps {
  videoId: string;
}

type ViewerState = "loading" | "loaded" | "empty" | "error";

function highlightText(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) return [text];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-[var(--accent-signal)]/25 text-[var(--accent-signal)] rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function TranscriptViewer({ videoId }: TranscriptViewerProps) {
  const [state, setState] = useState<ViewerState>("loading");
  const [transcript, setTranscript] = useState("");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMsg("");
      try {
        const data = await fetchVideoTranscript(videoId);
        if (cancelled) return;
        if (!data || (typeof data === "string" && !data.trim())) {
          setState("empty");
        } else {
          setTranscript(typeof data === "string" ? data : JSON.stringify(data, null, 2));
          setState("loaded");
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to load transcript");
        setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const handleRetry = useCallback(() => {
    setState("loading");
    fetchVideoTranscript(videoId)
      .then((data) => {
        if (!data || (typeof data === "string" && !data.trim())) {
          setState("empty");
        } else {
          setTranscript(typeof data === "string" ? data : JSON.stringify(data, null, 2));
          setState("loaded");
        }
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load transcript");
        setState("error");
      });
  }, [videoId]);

  const paragraphs = useMemo(() => {
    if (!transcript) return [];
    return transcript
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [transcript]);

  const filteredParagraphs = useMemo(() => {
    if (!search.trim()) return paragraphs;
    const lower = search.toLowerCase();
    return paragraphs.filter((p) => p.toLowerCase().includes(lower));
  }, [paragraphs, search]);

  const matchCount = useMemo(() => {
    if (!search.trim()) return 0;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    return (transcript.match(regex) || []).length;
  }, [transcript, search]);

  return (
    <div className="glass-surface flex flex-col h-full max-h-[600px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="font-display text-lg tracking-wider text-[var(--text-strong)]">
          TRANSCRIPT
        </h3>
      </div>

      {state === "loaded" && (
        <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transcript…"
              aria-label="Search transcript"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--bg-0)] text-[var(--text-strong)] placeholder-[var(--text-dim)] border border-[var(--border-subtle)] focus:border-[var(--accent-signal)] focus:outline-none transition-colors"
            />
            {search.trim() && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)]">
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {state === "loading" && (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-[var(--surface-1)]"
                style={{ width: `${60 + Math.random() * 35}%` }}
              />
            ))}
          </div>
        )}

        {state === "empty" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-dim)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm text-[var(--text-dim)]">No transcript available</p>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              The video may not have been indexed yet.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-live)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-[var(--accent-live)]">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-[var(--accent-signal)] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {state === "loaded" && (
          <div className="space-y-4">
            {filteredParagraphs.length === 0 && search.trim() ? (
              <p className="text-sm text-[var(--text-dim)] text-center py-8">
                No matches for &ldquo;{search}&rdquo;
              </p>
            ) : (
              filteredParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm text-[var(--text-muted)] leading-relaxed"
                >
                  {search.trim()
                    ? highlightText(paragraph, search)
                    : paragraph}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
