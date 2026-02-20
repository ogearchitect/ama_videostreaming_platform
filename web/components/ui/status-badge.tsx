import type { VideoStatus } from "@/lib/schemas/video";

interface StatusBadgeProps {
  status: VideoStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  VideoStatus,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  uploaded: {
    label: "Uploaded",
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  indexing: {
    label: "Indexing",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
    pulse: true,
  },
  indexed: {
    label: "Indexed",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses =
    size === "md"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-2 py-0.5 text-[0.65rem] gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium uppercase tracking-wider ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? "animate-pulse" : ""}`}
      />
      {config.label}
    </span>
  );
}

export function LiveBadge() {
  return <span className="live-badge">LIVE</span>;
}
