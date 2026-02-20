import type { Video, VideoStatus } from "@/lib/schemas/video";

interface ScheduledEventsListProps {
  videos: Video[];
}

const STATUS_DOT_COLOR: Record<VideoStatus, string> = {
  uploaded: "bg-[var(--accent-signal)]",
  indexing: "bg-amber-400",
  indexed: "bg-emerald-400",
  failed: "bg-[var(--accent-live)]",
};

const STATUS_LABEL: Record<VideoStatus, string> = {
  uploaded: "Uploaded",
  indexing: "Indexing",
  indexed: "Indexed",
  failed: "Failed",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = then - now;
  const absDiff = Math.abs(diffMs);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const future = diffMs > 0;

  if (days > 0) return future ? `in ${days}d` : `${days}d ago`;
  if (hours > 0) return future ? `in ${hours}h` : `${hours}h ago`;
  if (minutes > 0) return future ? `in ${minutes}m` : `${minutes}m ago`;
  return future ? "soon" : "just now";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function ScheduledEventsList({ videos }: ScheduledEventsListProps) {
  const sorted = [...videos].sort(
    (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
  );

  return (
    <div className="glass-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-5 py-3">
        <h2 className="font-display text-sm tracking-widest text-[var(--text-muted)]">
          SCHEDULED
        </h2>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--text-dim)]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-[var(--text-dim)]">No events scheduled</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {sorted.map((video) => (
            <li
              key={video.id}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-1)]"
            >
              {/* Status dot */}
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLOR[video.status]}`}
                title={STATUS_LABEL[video.status]}
              />

              {/* Title */}
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-strong)]">
                {truncate(video.name, 40)}
              </span>

              {/* Relative time */}
              <span className="shrink-0 text-xs text-[var(--text-dim)]">
                {relativeTime(video.uploaded_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
