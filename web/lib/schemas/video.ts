/**
 * Video domain types mirroring the FastAPI backend Pydantic models.
 */

export type VideoStatus = "uploaded" | "indexing" | "indexed" | "failed";

export interface Video {
  id: string;
  name: string;
  blob_url: string;
  status: VideoStatus;
  uploaded_at: string;
  indexed_at?: string;
  duration?: number;
  size_bytes?: number;
  content_type?: string;
}

export interface VideoInsights {
  video_id: string;
  transcript?: string;
  keywords: string[];
  topics: string[];
  faces: Record<string, unknown>[];
  labels: string[];
  sentiments: Record<string, unknown>[];
  brands: string[];
  language?: string;
}

export interface VideoUploadResponse {
  video_id: string;
  blob_url: string;
  message: string;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
}

export interface VideoIndexResponse {
  message: string;
  video_id: string;
  status: VideoStatus;
}

export interface VideoDeleteResponse {
  message: string;
}
