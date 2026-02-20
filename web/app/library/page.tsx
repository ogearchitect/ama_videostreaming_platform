"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { fetchVideos } from "@/lib/api";
import type { Video, VideoStatus } from "@/lib/schemas/video";
import { StatusBadge } from "@/components/ui/status-badge";
import { SkeletonCard } from "@/components/ui/loading-skeleton";
import ErrorState from "@/components/ui/error-state";
import EmptyState from "@/components/ui/empty-state";
import VideoActions from "@/components/client/video-actions";

type StatusFilter = "all" | VideoStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "uploaded", label: "Uploaded" },
  { value: "indexing", label: "Indexing" },
  { value: "indexed", label: "Indexed" },
  { value: "failed", label: "Failed" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { videos: data } = await fetchVideos();
      setVideos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load video library.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const filteredVideos = useMemo(() => {
    const sorted = [...videos].sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(),
    );
    if (statusFilter === "all") return sorted;
    return sorted.filter((v) => v.status === statusFilter);
  }, [videos, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-[var(--text-strong)] lg:text-4xl">
            VIDEO LIBRARY
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {videos.length} video{videos.length !== 1 ? "s" : ""} in archive
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                statusFilter === f.value
                  ? "bg-[var(--accent-signal)] text-[var(--bg-0)] shadow-lg shadow-[var(--accent-signal)]/20"
                  : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-signal)]/40 hover:text-[var(--text-strong)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <ErrorState
          title="ARCHIVE UNAVAILABLE"
          message={error}
          onRetry={loadVideos}
        />
      )}

      {/* Empty state */}
      {!loading && !error && filteredVideos.length === 0 && (
        <EmptyState
          title="NO VIDEOS FOUND"
          description={
            statusFilter !== "all"
              ? `No videos match the "${statusFilter}" filter. Try selecting a different status.`
              : "The video library is empty. Upload your first video to get started."
          }
          icon={
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      )}

      {/* Video grid */}
      {!loading && !error && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVideos.map((video) => (
            <article
              key={video.id}
              className="glass-surface card-hover flex flex-col overflow-hidden"
            >
              {/* Thumbnail / link */}
              <Link
                href={`/events/${video.id}`}
                className="group relative block"
              >
                <div className="aspect-video w-full bg-[var(--bg-1)]">
                  <div className="flex h-full items-center justify-center">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[var(--text-dim)] transition-colors group-hover:text-[var(--accent-signal)]"
                      aria-hidden="true"
                    >
                      <polygon
                        points="5 3 19 12 5 21 5 3"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Link href={`/events/${video.id}`}>
                  <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-strong)] transition-colors hover:text-[var(--accent-signal)]">
                    {video.name}
                  </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <StatusBadge status={video.status} />
                  <span className="text-[var(--text-dim)]">&middot;</span>
                  <span>{formatDate(video.uploaded_at)}</span>
                  {video.size_bytes != null && (
                    <>
                      <span className="text-[var(--text-dim)]">&middot;</span>
                      <span>{formatBytes(video.size_bytes)}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 border-t border-[var(--border-subtle)]">
                  <VideoActions video={video} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
