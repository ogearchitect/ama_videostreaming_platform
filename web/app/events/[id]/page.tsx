import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchVideo } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import VideoPlayer from "@/components/client/video-player";
import TranscriptViewer from "@/components/client/transcript-viewer";
import InsightsPanel from "@/components/client/insights-panel";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const video = await fetchVideo(id);
    return {
      title: `${video.name} — AMA Stream`,
      description: `Watch and explore insights for ${video.name}.`,
    };
  } catch {
    return { title: "Event Not Found — AMA Stream" };
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;

  let video;
  try {
    video = await fetchVideo(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      {/* Video Player */}
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-black">
        <VideoPlayer
          src={video.blob_url}
          title={video.name}
        />
      </section>

      {/* Metadata Strip */}
      <section className="glass-surface mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <h1 className="font-display text-2xl tracking-wide text-[var(--text-strong)] lg:text-3xl">
          {video.name}
        </h1>
        <StatusBadge status={video.status} size="md" />
        <span className="text-sm text-[var(--text-muted)]">
          {formatDate(video.uploaded_at)}
        </span>
        {video.duration != null && (
          <span className="text-sm text-[var(--text-muted)]">
            {formatDuration(video.duration)}
          </span>
        )}
        {video.size_bytes != null && (
          <span className="text-sm text-[var(--text-dim)]">
            {formatBytes(video.size_bytes)}
          </span>
        )}
      </section>

      {/* Transcript & Insights */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="glass-surface p-5">
          <h2 className="font-display mb-4 text-sm tracking-widest text-[var(--text-muted)]">
            TRANSCRIPT
          </h2>
          <TranscriptViewer videoId={video.id} />
        </section>
        <section className="glass-surface p-5">
          <h2 className="font-display mb-4 text-sm tracking-widest text-[var(--text-muted)]">
            INSIGHTS
          </h2>
          <InsightsPanel videoId={video.id} />
        </section>
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-signal)] transition-colors hover:text-[var(--accent-hover)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
