import {
  SkeletonCard,
  SkeletonText,
} from "@/components/ui/loading-skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      {/* Page header skeleton */}
      <div className="mb-8 h-9 w-48 animate-pulse rounded bg-[var(--surface-1)]" />

      {/* Analytics overview skeleton */}
      <div className="mb-10 glass-surface p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-1)]" />
              <div className="h-8 w-16 animate-pulse rounded bg-[var(--surface-1)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Insights summary skeleton */}
      <div className="mb-10">
        <div className="mb-5 h-6 w-52 animate-pulse rounded bg-[var(--surface-1)]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-surface p-5 space-y-3">
              <SkeletonText width="w-32" />
              <div className="h-10 w-20 animate-pulse rounded bg-[var(--surface-1)]" />
              <div className="h-2 w-full animate-pulse rounded-full bg-[var(--surface-1)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Keywords & topics skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard className="min-h-[200px]" />
        <SkeletonCard className="min-h-[200px]" />
      </div>
    </div>
  );
}
