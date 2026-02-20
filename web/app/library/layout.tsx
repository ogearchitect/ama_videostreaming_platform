import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library — AMA Stream",
  description:
    "Browse, filter, and manage all uploaded videos in the AMA Video Streaming Platform.",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
