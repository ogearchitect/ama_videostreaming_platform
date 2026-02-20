/**
 * Video API client functions.
 *
 * All functions use the shared `apiFetch` helper so error handling,
 * base-URL resolution, and header management are consistent.
 */

import { apiFetch } from "./config";
import type {
  Video,
  VideoDeleteResponse,
  VideoIndexResponse,
  VideoInsights,
  VideoListResponse,
  VideoUploadResponse,
} from "../schemas/video";

/**
 * List all videos.
 *
 * GET /api/videos
 */
export async function fetchVideos(): Promise<VideoListResponse> {
  return apiFetch<VideoListResponse>("/api/videos");
}

/**
 * Get a single video by ID.
 *
 * GET /api/videos/{id}
 */
export async function fetchVideo(id: string): Promise<Video> {
  return apiFetch<Video>(`/api/videos/${encodeURIComponent(id)}`);
}

/**
 * Upload a video file.
 *
 * POST /api/videos/upload (multipart/form-data)
 */
export async function uploadVideo(file: File): Promise<VideoUploadResponse> {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<VideoUploadResponse>("/api/videos/upload", {
    method: "POST",
    body: form,
  });
}

/**
 * Trigger indexing for a video.
 *
 * POST /api/videos/{id}/index
 */
export async function indexVideo(id: string): Promise<VideoIndexResponse> {
  return apiFetch<VideoIndexResponse>(
    `/api/videos/${encodeURIComponent(id)}/index`,
    { method: "POST" },
  );
}

/**
 * Fetch Video Indexer insights for a video.
 *
 * GET /api/videos/{id}/insights
 */
export async function fetchVideoInsights(
  id: string,
): Promise<VideoInsights> {
  return apiFetch<VideoInsights>(
    `/api/videos/${encodeURIComponent(id)}/insights`,
  );
}

/**
 * Fetch the transcript text for a video.
 *
 * GET /api/videos/{id}/transcript
 *
 * Returns the raw transcript string.
 */
export async function fetchVideoTranscript(id: string): Promise<string> {
  return apiFetch<string>(
    `/api/videos/${encodeURIComponent(id)}/transcript`,
  );
}

/**
 * Delete a video.
 *
 * DELETE /api/videos/{id}
 */
export async function deleteVideo(id: string): Promise<VideoDeleteResponse> {
  return apiFetch<VideoDeleteResponse>(
    `/api/videos/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
