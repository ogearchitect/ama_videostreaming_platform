"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchVideoInsights } from "@/lib/api";
import type { VideoInsights } from "@/lib/schemas/video";

interface InsightsPanelProps {
  videoId: string;
}

type TabId = "keywords" | "topics" | "labels" | "brands" | "sentiments";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "keywords", label: "Keywords" },
  { id: "topics", label: "Topics" },
  { id: "labels", label: "Labels" },
  { id: "brands", label: "Brands" },
  { id: "sentiments", label: "Sentiments" },
];

type PanelState = "loading" | "loaded" | "error";

function getSentimentColor(sentiment: Record<string, unknown>): {
  bg: string;
  text: string;
  label: string;
} {
  const value = (
    (sentiment.sentimentType as string) ??
    (sentiment.sentiment as string) ??
    (sentiment.label as string) ??
    "neutral"
  ).toLowerCase();

  if (value.includes("positive")) {
    return { bg: "bg-green-900/40 border-green-700/30", text: "text-green-400", label: "Positive" };
  }
  if (value.includes("negative")) {
    return { bg: "bg-red-900/40 border-red-700/30", text: "text-red-400", label: "Negative" };
  }
  return { bg: "bg-gray-800/40 border-gray-600/30", text: "text-gray-400", label: "Neutral" };
}

function formatSentimentLabel(s: Record<string, unknown>): string {
  return (
    (s.sentimentType as string) ??
    (s.sentiment as string) ??
    (s.label as string) ??
    "Unknown"
  );
}

function formatSentimentScore(s: Record<string, unknown>): string | null {
  const score =
    (s.averageScore as number) ??
    (s.score as number) ??
    (s.confidence as number) ??
    null;
  if (score !== null && typeof score === "number") {
    return `${(score * 100).toFixed(0)}%`;
  }
  return null;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="flex flex-wrap gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-7 rounded-full bg-[var(--surface-1)]"
            style={{ width: `${50 + Math.random() * 60}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function InsightsPanel({ videoId }: InsightsPanelProps) {
  const [state, setState] = useState<PanelState>("loading");
  const [insights, setInsights] = useState<VideoInsights | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("keywords");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const data = await fetchVideoInsights(videoId);
      setInsights(data);
      setState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load insights");
      setState("error");
    }
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  const renderTabContent = () => {
    if (state === "loading") return <LoadingSkeleton />;

    if (state === "error") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <svg
            width="36"
            height="36"
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
            onClick={load}
            className="mt-3 text-sm text-[var(--accent-signal)] hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!insights) return null;

    switch (activeTab) {
      case "keywords":
        return (
          <div className="p-4">
            {insights.keywords.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No keywords found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--accent-signal)]/15 text-[var(--accent-signal)] border border-[var(--accent-signal)]/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "topics":
        return (
          <div className="p-4">
            {insights.topics.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No topics found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-1)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "labels":
        return (
          <div className="p-4">
            {insights.labels.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No labels found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.labels.map((label, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/20"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "brands":
        return (
          <div className="p-4">
            {insights.brands.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No brands found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.brands.map((brand, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-700/20"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "sentiments":
        return (
          <div className="p-4">
            {insights.sentiments.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No sentiment data</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.sentiments.map((s, i) => {
                  const { bg, text, label } = getSentimentColor(s);
                  const score = formatSentimentScore(s);
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${bg} ${text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          label === "Positive"
                            ? "bg-green-400"
                            : label === "Negative"
                              ? "bg-red-400"
                              : "bg-gray-400"
                        }`}
                      />
                      {formatSentimentLabel(s)}
                      {score && (
                        <span className="opacity-60">{score}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="glass-surface flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="font-display text-lg tracking-wider text-[var(--text-strong)]">
          INSIGHTS
        </h3>
      </div>

      <div
        className="flex border-b border-[var(--border-subtle)] overflow-x-auto"
        role="tablist"
        aria-label="Insights categories"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? "text-[var(--accent-signal)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent-signal)]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {renderTabContent()}
      </div>
    </div>
  );
}
