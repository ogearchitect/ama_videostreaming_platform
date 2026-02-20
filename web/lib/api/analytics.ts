/**
 * Analytics API client functions.
 *
 * All functions follow the same patterns established in `videos.ts`.
 */

import { apiFetch } from "./config";
import type {
  AnalyticsData,
  FrontDoorConfig,
  InsightsSummary,
  SyncResponse,
} from "../schemas/analytics";

/**
 * Fetch aggregated video analytics.
 *
 * GET /api/analytics/videos
 */
export async function fetchVideoAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>("/api/analytics/videos");
}

/**
 * Fetch the insights summary (top keywords, topics, etc.).
 *
 * GET /api/analytics/insights
 */
export async function fetchInsightsSummary(): Promise<InsightsSummary> {
  return apiFetch<InsightsSummary>("/api/analytics/insights");
}

/**
 * Trigger a Synapse Analytics sync.
 *
 * POST /api/analytics/sync
 */
export async function syncAnalytics(): Promise<SyncResponse> {
  return apiFetch<SyncResponse>("/api/analytics/sync", { method: "POST" });
}

/**
 * Fetch Front Door CDN configuration.
 *
 * GET /api/analytics/front-door
 */
export async function fetchFrontDoorConfig(): Promise<FrontDoorConfig> {
  return apiFetch<FrontDoorConfig>("/api/analytics/front-door");
}
