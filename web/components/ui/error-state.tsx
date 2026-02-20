"use client";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "SOMETHING WENT WRONG",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="glass-surface flex flex-col items-center gap-4 px-6 py-10 text-center">
      {/* Warning icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-live)]/10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--accent-live)]"
          aria-hidden="true"
        >
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="font-display text-lg tracking-widest text-[var(--text-strong)]">
        {title}
      </h3>

      <p className="max-w-sm text-sm text-[var(--text-muted)]">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[var(--accent-signal)] px-5 py-2 font-display text-xs tracking-widest text-[var(--accent-signal)] transition-colors hover:bg-[var(--accent-signal)]/10"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              d="M1 4v6h6M23 20v-6h-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          RETRY
        </button>
      )}
    </div>
  );
}
