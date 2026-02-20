interface SkeletonTextProps {
  width?: string;
  className?: string;
}

export function SkeletonText({ width = "w-full", className = "" }: SkeletonTextProps) {
  return (
    <div
      className={`h-3 animate-pulse rounded bg-[var(--surface-1)] ${width} ${className}`}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`glass-surface overflow-hidden ${className}`}>
      {/* Thumbnail area */}
      <div className="aspect-video w-full animate-pulse bg-[var(--surface-1)]" />
      {/* Text area */}
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-1)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--surface-1)]" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--surface-1)]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-1)]" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonHeroProps {
  className?: string;
}

export function SkeletonHero({ className = "" }: SkeletonHeroProps) {
  return (
    <div className={`glass-surface relative overflow-hidden ${className}`}>
      <div className="aspect-video w-full animate-pulse bg-[var(--surface-1)]" />
      {/* Overlay content skeleton */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 lg:p-8">
        <div className="mb-3 h-5 w-20 animate-pulse rounded bg-white/10" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="mt-3 flex gap-4">
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
        </div>
        <div className="mt-5 h-10 w-36 animate-pulse rounded-lg bg-white/10" />
      </div>
    </div>
  );
}

interface SkeletonRowProps {
  className?: string;
}

export function SkeletonRow({ className = "" }: SkeletonRowProps) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${className}`}>
      <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--surface-1)]" />
      <div className="h-3 flex-1 animate-pulse rounded bg-[var(--surface-1)]" />
      <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-[var(--surface-1)]" />
    </div>
  );
}
