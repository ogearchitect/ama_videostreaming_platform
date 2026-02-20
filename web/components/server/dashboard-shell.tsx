import type { ReactNode } from "react";

interface DashboardShellProps {
  hero?: ReactNode;
  chat?: ReactNode;
  wideRail?: ReactNode;
  scheduledList?: ReactNode;
  compactStack?: ReactNode;
  children?: ReactNode;
}

export default function DashboardShell({
  hero,
  chat,
  wideRail,
  scheduledList,
  compactStack,
  children,
}: DashboardShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 lg:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        {/* Left column — Hero, Chat, Wide Rail */}
        <div className="flex flex-col gap-6 lg:gap-8 order-1">
          {hero && <section>{hero}</section>}
          {/* On mobile: scheduled list surfaces between hero and chat */}
          <div className="lg:hidden order-2">{scheduledList}</div>
          {chat && <section className="order-3">{chat}</section>}
          {wideRail && <section className="order-4">{wideRail}</section>}
        </div>

        {/* Right column — Scheduled List + Compact Stack */}
        <aside className="flex flex-col gap-6 lg:gap-8 order-2 lg:order-2">
          <div className="hidden lg:block">{scheduledList}</div>
          {compactStack && <section>{compactStack}</section>}
        </aside>
      </div>

      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
