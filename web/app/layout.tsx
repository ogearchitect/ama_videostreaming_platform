import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMA Video Streaming",
  description:
    "AMA Video Streaming Platform — Upload, index, and stream video content with Azure-powered intelligence and cinematic delivery.",
  keywords: [
    "video streaming",
    "video platform",
    "Azure",
    "video indexer",
    "CMAF",
    "live streaming",
  ],
  authors: [{ name: "AMA Video Streaming" }],
  openGraph: {
    title: "AMA Video Streaming",
    description:
      "Upload, index, and stream video content with Azure-powered intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[var(--bg-0)] text-[var(--text-strong)] antialiased">
        {children}
      </body>
    </html>
  );
}
