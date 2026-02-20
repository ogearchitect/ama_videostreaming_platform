/**
 * Public barrel export for the API layer.
 *
 * Usage:
 *   import { fetchVideos, uploadVideo, fetchVideoAnalytics } from "@/lib/api";
 */

// ── Video APIs ──────────────────────────────────────────────────────────────
export {
  fetchVideos,
  fetchVideo,
  uploadVideo,
  indexVideo,
  fetchVideoInsights,
  fetchVideoTranscript,
  deleteVideo,
} from "./videos";

// ── Analytics APIs ──────────────────────────────────────────────────────────
export {
  fetchVideoAnalytics,
  fetchInsightsSummary,
  syncAnalytics,
  fetchFrontDoorConfig,
} from "./analytics";

// ── Shared utilities & types ────────────────────────────────────────────────
export { apiUrl, apiFetch, ApiError } from "./config";

// ── Re-export all schema types ──────────────────────────────────────────────
export type {
  Video,
  VideoStatus,
  VideoInsights,
  VideoUploadResponse,
  VideoListResponse,
  VideoIndexResponse,
  VideoDeleteResponse,
} from "../schemas/video";

export type {
  AnalyticsData,
  InsightsSummary,
  FrontDoorConfig,
  KeywordEntry,
  TopicEntry,
  SyncResponse,
} from "../schemas/analytics";
