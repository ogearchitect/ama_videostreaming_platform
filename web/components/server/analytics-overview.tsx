import type { AnalyticsData } from "@/lib/schemas/analytics";

interface AnalyticsOverviewProps {
  data: AnalyticsData | null;
  loading?: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "signal" | "live" | "default";
}) {
  const valueColor =
    accent === "signal"
      ? "text-[var(--accent-signal)]"
      : accent === "live"
        ? "text-[var(--accent-live)]"
        : "text-[var(--text-strong)]";

  return (
    <div className="glass-surface flex flex-col items-center gap-1 p-5 text-center">
      <span className={`font-display text-4xl leading-none ${valueColor}`}>
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="glass-surface flex flex-col items-center gap-3 p-5">
      <div className="h-10 w-20 animate-pulse rounded bg-[var(--surface-1)]" />
      <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-1)]" />
    </div>
  );
}

function TagChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent-signal)]/40 hover:text-[var(--text-strong)]">
      {label}
      <span className="text-[var(--text-dim)]">({count})</span>
    </span>
  );
}

export default function AnalyticsOverview({
  data,
  loading = false,
}: AnalyticsOverviewProps) {
  if (loading) {
    return (
      <div>
        <h2 className="font-display mb-4 text-lg tracking-widest text-[var(--text-muted)]">
          ANALYTICS
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="mt-6 space-y-4">
          <div className="glass-surface p-5">
            <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[var(--surface-1)]" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-[var(--surface-1)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h2 className="font-display mb-4 text-lg tracking-widest text-[var(--text-muted)]">
          ANALYTICS
        </h2>
        <div className="glass-surface flex flex-col items-center gap-2 px-5 py-12 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--text-dim)]"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 17V13M12 17V9M17 17V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-[var(--text-dim)]">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display mb-4 text-lg tracking-widest text-[var(--text-muted)]">
        ANALYTICS
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Videos" value={data.total_videos} accent="signal" />
        <StatCard label="Indexed" value={data.indexed_videos} accent="signal" />
        <StatCard label="Failed" value={data.failed_videos} accent={data.failed_videos > 0 ? "live" : "default"} />
        <StatCard label="Total Duration" value={formatDuration(data.total_duration)} accent="default" />
      </div>

      {/* Keywords */}
      {data.top_keywords.length > 0 && (
        <div className="glass-surface mt-6 p-5">
          <h3 className="font-display mb-3 text-sm tracking-widest text-[var(--text-muted)]">
            TOP KEYWORDS
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.top_keywords.map((kw) => (
              <TagChip key={kw.keyword} label={kw.keyword} count={kw.count} />
            ))}
          </div>
        </div>
      )}

      {/* Topics */}
      {data.top_topics.length > 0 && (
        <div className="glass-surface mt-4 p-5">
          <h3 className="font-display mb-3 text-sm tracking-widest text-[var(--text-muted)]">
            TOP TOPICS
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.top_topics.map((tp) => (
              <TagChip key={tp.topic} label={tp.topic} count={tp.count} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
