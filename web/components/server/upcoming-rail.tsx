import type { Video, VideoStatus } from "@/lib/schemas/video";

interface UpcomingRailProps {
  videos: Video[];
  variant?: "wide" | "compact";
}

const STATUS_COLOR: Record<VideoStatus, string> = {
  uploaded: "bg-[var(--accent-signal)]",
  indexing: "bg-amber-400",
  indexed: "bg-emerald-400",
  failed: "bg-[var(--accent-live)]",
};

const STATUS_TEXT: Record<VideoStatus, string> = {
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

function WideCard({ video }: { video: Video }) {
  return (
    <div className="glass-surface card-hover relative flex-shrink-0 w-72 overflow-hidden">
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-[var(--bg-1)] via-[var(--surface-1)] to-[var(--bg-0)]">
        {/* Gradient overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white ${STATUS_COLOR[video.status]}/80 backdrop-blur-sm`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-white`} />
            {STATUS_TEXT[video.status]}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 inset-x-0 p-3">
          <h3 className="truncate text-sm font-semibold text-white">
            {video.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/60">
            {relativeTime(video.uploaded_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactCard({ video }: { video: Video }) {
  return (
    <div className="glass-surface card-hover flex items-center gap-3 p-3">
      {/* Small thumb */}
      <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-[var(--bg-1)] via-[var(--surface-1)] to-[var(--bg-0)]" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-[var(--text-strong)]">
          {video.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[video.status]}`}
          />
          <span className="text-xs text-[var(--text-dim)]">
            {STATUS_TEXT[video.status]}
          </span>
          <span className="text-xs text-[var(--text-dim)]">·</span>
          <span className="text-xs text-[var(--text-dim)]">
            {relativeTime(video.uploaded_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UpcomingRail({
  videos,
  variant = "wide",
}: UpcomingRailProps) {
  const title = variant === "wide" ? "UPCOMING" : "UP NEXT";

  if (videos.length === 0) {
    return (
      <div>
        <h2 className="font-display mb-3 text-sm tracking-widest text-[var(--text-muted)]">
          {title}
        </h2>
        <div className="glass-surface flex items-center justify-center px-5 py-10">
          <p className="text-sm text-[var(--text-dim)]">Nothing upcoming</p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div>
        <h2 className="font-display mb-3 text-sm tracking-widest text-[var(--text-muted)]">
          {title}
        </h2>
        <div className="flex flex-col gap-2">
          {videos.map((video) => (
            <CompactCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display mb-3 text-sm tracking-widest text-[var(--text-muted)]">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {videos.map((video) => (
          <WideCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
