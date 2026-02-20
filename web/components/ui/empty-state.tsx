import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="glass-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && (
        <div className="text-[var(--text-dim)]">{icon}</div>
      )}

      {!icon && (
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--text-dim)]"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 9l6 6M15 9l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}

      <h3 className="font-display text-lg tracking-widest text-[var(--text-strong)]">
        {title}
      </h3>

      {description && (
        <p className="max-w-xs text-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
    </div>
  );
}
