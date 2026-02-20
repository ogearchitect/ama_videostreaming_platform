/**
 * Analytics domain types mirroring the FastAPI backend Pydantic models.
 */

export interface KeywordEntry {
  keyword: string;
  count: number;
}

export interface TopicEntry {
  topic: string;
  count: number;
}

export interface AnalyticsData {
  total_videos: number;
  total_duration: number;
  indexed_videos: number;
  failed_videos: number;
  top_keywords: KeywordEntry[];
  top_topics: TopicEntry[];
}

export interface InsightsSummary {
  summary: Record<string, unknown>;
  top_keywords: KeywordEntry[];
  top_topics: TopicEntry[];
}

export interface FrontDoorConfig {
  configuration: Record<string, unknown>;
  cache_policy: Record<string, unknown>;
}

export interface SyncResponse {
  message: string;
}
