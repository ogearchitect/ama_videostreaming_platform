import type { ReactNode } from "react";
import type { Video } from "@/lib/schemas/video";

interface HeroLiveCardProps {
  video?: Video;
  countdownSlot?: ReactNode;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HeroLiveCard({ video, countdownSlot }: HeroLiveCardProps) {
  if (!video) {
    return (
      <div className="glass-surface relative flex aspect-video w-full items-center justify-center overflow-hidden">
        {/* Cinematic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-1)] via-[var(--surface-0)] to-[var(--bg-0)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(0,212,255,0.06),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--text-dim)]"
            aria-hidden="true"
          >
            <path
              d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887a.375.375 0 01.557-.328l5.603 3.113z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="font-display text-lg tracking-widest text-[var(--text-dim)]">
            NO LIVE EVENTS
          </p>
          <p className="max-w-xs text-sm text-[var(--text-dim)]">
            Check back soon for upcoming broadcasts and live content.
          </p>
        </div>
      </div>
    );
  }

  const isLive = video.status === "indexing";

  return (
    <div className="glass-surface grain-overlay relative w-full overflow-hidden">
      <div className="relative aspect-video w-full">
        {/* Background gradient (thumbnail placeholder) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-1)] via-[var(--surface-1)] to-[var(--bg-0)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,45,85,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(0,212,255,0.06),transparent_60%)]" />

        {/* Bottom gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
          {/* Status badge */}
          <div className="mb-3">
            {isLive ? (
              <span className="live-badge">LIVE NOW</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-signal)]/20 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--accent-signal)] backdrop-blur-sm">
                STARTS IN
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
            {video.name}
          </h1>

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
            {video.duration != null && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formatDuration(video.duration)}
              </span>
            )}
            {video.content_type && (
              <span>{video.content_type}</span>
            )}
            {video.size_bytes != null && (
              <span>{formatBytes(video.size_bytes)}</span>
            )}
          </div>

          {/* Countdown slot */}
          {countdownSlot && <div className="mt-3">{countdownSlot}</div>}

          {/* CTA */}
          <div className="mt-5">
            {isLive ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-live)] px-6 py-2.5 font-display text-sm tracking-widest text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                WATCH NOW
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-signal)] px-6 py-2.5 font-display text-sm tracking-widest text-[var(--accent-signal)] transition-colors hover:bg-[var(--accent-signal)]/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                SET REMINDER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
