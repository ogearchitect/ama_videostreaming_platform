import {
  SkeletonHero,
  SkeletonCard,
  SkeletonRow,
} from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Hero skeleton */}
          <SkeletonHero />

          {/* Chat skeleton */}
          <div className="glass-surface p-5">
            <div className="mb-4 h-4 w-24 animate-pulse rounded bg-[var(--surface-1)]" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>

          {/* Wide rail skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-6 lg:gap-8">
          {/* Scheduled list skeleton */}
          <div className="glass-surface p-5">
            <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--surface-1)]" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>

          {/* Compact stack skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="!aspect-auto" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
