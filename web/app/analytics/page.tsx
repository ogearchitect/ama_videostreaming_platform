import type { Metadata } from "next";
import { fetchVideoAnalytics, fetchInsightsSummary } from "@/lib/api";
import AnalyticsOverview from "@/components/server/analytics-overview";
import ErrorState from "@/components/ui/error-state";

export const metadata: Metadata = {
  title: "Analytics — AMA Stream",
  description:
    "Platform analytics, indexing metrics, and content insights for the AMA Video Streaming Platform.",
};

export default async function AnalyticsPage() {
  try {
    const [analytics, insights] = await Promise.all([
      fetchVideoAnalytics(),
      fetchInsightsSummary(),
    ]);

    const totalVideos = analytics.total_videos || 1;
    const indexRate = Math.round(
      (analytics.indexed_videos / totalVideos) * 100,
    );

    return (
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
        {/* Page header */}
        <h1 className="font-display mb-8 text-3xl tracking-wide text-[var(--text-strong)] lg:text-4xl">
          ANALYTICS
        </h1>

        {/* Analytics Overview */}
        <section className="mb-10">
          <AnalyticsOverview data={analytics} />
        </section>

        {/* Insights Summary */}
        <section className="mb-10">
          <h2 className="font-display mb-5 text-xl tracking-wide text-[var(--text-strong)]">
            INSIGHTS SUMMARY
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Indexing success rate */}
            <div className="glass-surface p-5">
              <p className="font-display text-xs tracking-widest text-[var(--text-muted)]">
                INDEXING SUCCESS RATE
              </p>
              <p className="mt-2 font-display text-4xl text-[var(--accent-signal)]">
                {indexRate}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-1)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-signal)] to-[var(--accent-live)] transition-all duration-700"
                  style={{ width: `${indexRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-dim)]">
                {analytics.indexed_videos} of {analytics.total_videos} videos
                indexed
              </p>
            </div>

            {/* Failed videos */}
            <div className="glass-surface p-5">
              <p className="font-display text-xs tracking-widest text-[var(--text-muted)]">
                FAILED INDEXING
              </p>
              <p className="mt-2 font-display text-4xl text-[var(--accent-live)]">
                {analytics.failed_videos}
              </p>
              <p className="mt-2 text-xs text-[var(--text-dim)]">
                video{analytics.failed_videos !== 1 ? "s" : ""} require
                attention
              </p>
            </div>

            {/* Total duration */}
            <div className="glass-surface p-5">
              <p className="font-display text-xs tracking-widest text-[var(--text-muted)]">
                TOTAL DURATION
              </p>
              <p className="mt-2 font-display text-4xl text-[var(--text-strong)]">
                {Math.round(analytics.total_duration / 60)}
                <span className="ml-1 text-lg text-[var(--text-muted)]">
                  min
                </span>
              </p>
              <p className="mt-2 text-xs text-[var(--text-dim)]">
                across {analytics.total_videos} videos
              </p>
            </div>
          </div>
        </section>

        {/* Top Keywords & Topics */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Keywords */}
          <div className="glass-surface p-5">
            <h3 className="font-display mb-4 text-sm tracking-widest text-[var(--text-muted)]">
              TOP KEYWORDS
            </h3>
            {insights.top_keywords.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">
                No keywords extracted yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {insights.top_keywords.map((kw) => (
                  <span
                    key={kw.keyword}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-strong)] transition-colors hover:border-[var(--accent-signal)]/40"
                  >
                    <span>{kw.keyword}</span>
                    <span className="text-[var(--text-dim)]">{kw.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Topics */}
          <div className="glass-surface p-5">
            <h3 className="font-display mb-4 text-sm tracking-widest text-[var(--text-muted)]">
              TOP TOPICS
            </h3>
            {insights.top_topics.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">
                No topics extracted yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {insights.top_topics.map((topic) => (
                  <li
                    key={topic.topic}
                    className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2 last:border-0"
                  >
                    <span className="text-sm text-[var(--text-strong)]">
                      {topic.topic}
                    </span>
                    <span className="font-display text-sm text-[var(--accent-signal)]">
                      {topic.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Front Door Configuration */}
        <section>
          <h2 className="font-display mb-5 text-xl tracking-wide text-[var(--text-strong)]">
            FRONT DOOR
          </h2>
          <div className="glass-surface p-5">
            <p className="text-sm text-[var(--text-muted)]">
              CDN and edge delivery configuration is managed via Azure Front
              Door. Check the{" "}
              <code className="rounded bg-[var(--surface-1)] px-1.5 py-0.5 text-xs text-[var(--accent-signal)]">
                /api/analytics/front-door
              </code>{" "}
              endpoint for the current configuration and cache policy.
            </p>
          </div>
        </section>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24">
        <ErrorState
          title="ANALYTICS OFFLINE"
          message="Unable to retrieve analytics data. The backend may be unavailable — please try again."
        />
      </div>
    );
  }
}
