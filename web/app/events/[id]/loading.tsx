import {
  SkeletonHero,
  SkeletonText,
  SkeletonCard,
} from "@/components/ui/loading-skeleton";

export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      {/* Player skeleton */}
      <SkeletonHero className="aspect-video" />

      {/* Metadata strip skeleton */}
      <div className="glass-surface mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <div className="h-7 w-56 animate-pulse rounded bg-[var(--surface-1)]" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--surface-1)]" />
        <SkeletonText width="w-28" />
        <SkeletonText width="w-14" />
      </div>

      {/* Transcript + Insights skeleton */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard className="min-h-[280px]" />
        <SkeletonCard className="min-h-[280px]" />
      </div>
    </div>
  );
}
