"use client";

import { useState, useCallback } from "react";
import { indexVideo, deleteVideo } from "@/lib/api";
import type { Video } from "@/lib/schemas/video";

interface VideoActionsProps {
  video: Video;
  onAction?: (action: string) => void;
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function VideoActions({ video, onAction }: VideoActionsProps) {
  const [indexing, setIndexing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showFeedback = useCallback((fb: Feedback) => {
    setFeedback(fb);
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const handleIndex = useCallback(async () => {
    setIndexing(true);
    setFeedback(null);
    try {
      const res = await indexVideo(video.id);
      showFeedback({ type: "success", message: res.message });
      onAction?.("indexed");
    } catch (err) {
      showFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Indexing failed",
      });
    } finally {
      setIndexing(false);
    }
  }, [video.id, onAction, showFeedback]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setFeedback(null);
    try {
      const res = await deleteVideo(video.id);
      showFeedback({ type: "success", message: res.message });
      setConfirmDelete(false);
      onAction?.("deleted");
    } catch (err) {
      showFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    } finally {
      setDeleting(false);
    }
  }, [video.id, onAction, showFeedback]);

  return (
    <div className="space-y-2">
      <div className="glass-surface inline-flex items-center rounded-lg overflow-hidden divide-x divide-[var(--border-subtle)]">
        {video.status === "uploaded" && (
          <button
            onClick={handleIndex}
            disabled={indexing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-signal)] hover:bg-[var(--surface-1)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {indexing ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--surface-1)" strokeWidth="3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            )}
            {indexing ? "Indexing…" : "Index"}
          </button>
        )}

        {video.status === "indexed" && (
          <button
            onClick={() => onAction?.("view-insights")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-signal)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            View Insights
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-live)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs text-[var(--accent-live)] mr-1">Sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-semibold rounded bg-[var(--accent-live)] text-white hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs font-medium rounded text-[var(--text-dim)] hover:text-[var(--text-strong)] transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`text-xs px-3 py-1.5 rounded-md inline-block ${
            feedback.type === "success"
              ? "text-green-400 bg-green-950/30 border border-green-800/30"
              : "text-[var(--accent-live)] bg-red-950/30 border border-red-800/30"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
