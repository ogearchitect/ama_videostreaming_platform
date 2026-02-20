import type { Metadata } from "next";
import { fetchVideos } from "@/lib/api";
import type { Video } from "@/lib/schemas/video";
import DashboardShell from "@/components/server/dashboard-shell";
import HeroLiveCard from "@/components/server/hero-live-card";
import ScheduledEventsList from "@/components/server/scheduled-events-list";
import UpcomingRail from "@/components/server/upcoming-rail";
import CountdownPulse from "@/components/client/countdown-pulse";
import LiveChatPanel from "@/components/client/live-chat-panel";
import ErrorState from "@/components/ui/error-state";

export const metadata: Metadata = {
  title: "Dashboard — AMA Stream",
  description:
    "Live broadcast dashboard for AMA Video Streaming Platform. Watch live events, browse upcoming sessions, and join the conversation.",
};

function segmentVideos(videos: Video[]) {
  const liveVideo = videos.find((v) => !v.indexed_at) ?? undefined;

  const scheduledVideos = videos
    .filter((v) => !v.indexed_at)
    .sort(
      (a, b) =>
        new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime(),
    );

  const liveId = liveVideo?.id;
  const upcomingVideos = videos.filter(
    (v) => v.id !== liveId || v.indexed_at,
  );

  return { liveVideo, scheduledVideos, upcomingVideos };
}

export default async function DashboardPage() {
  try {
    const { videos } = await fetchVideos();
    const { liveVideo, scheduledVideos, upcomingVideos } =
      segmentVideos(videos);

    const countdownTarget =
      liveVideo?.uploaded_at ?? new Date().toISOString();

    return (
      <DashboardShell
        hero={
          <HeroLiveCard
            video={liveVideo}
            countdownSlot={
              <CountdownPulse
                targetDate={countdownTarget}
                label="Next Event"
              />
            }
          />
        }
        scheduledList={<ScheduledEventsList videos={scheduledVideos} />}
        chat={<LiveChatPanel />}
        wideRail={<UpcomingRail videos={upcomingVideos} variant="wide" />}
        compactStack={
          <UpcomingRail
            videos={upcomingVideos.slice(0, 4)}
            variant="compact"
          />
        }
      />
    );
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24">
        <ErrorState
          title="BROADCAST SIGNAL LOST"
          message="We couldn't load the dashboard. The backend may be unavailable — please try again."
        />
      </div>
    );
  }
}
