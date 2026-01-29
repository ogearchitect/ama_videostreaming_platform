"""Data models for the video streaming platform."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class VideoStatus(str, Enum):
    """Video processing status."""
    UPLOADED = "uploaded"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


class Video(BaseModel):
    """Video model."""
    id: str
    name: str
    blob_url: str
    status: VideoStatus
    uploaded_at: datetime
    indexed_at: Optional[datetime] = None
    duration: Optional[float] = None
    size_bytes: Optional[int] = None
    content_type: Optional[str] = None


class VideoInsights(BaseModel):
    """Video insights from Video Indexer."""
    video_id: str
    transcript: Optional[str] = None
    keywords: List[str] = []
    topics: List[str] = []
    faces: List[Dict[str, Any]] = []
    labels: List[str] = []
    sentiments: List[Dict[str, Any]] = []
    brands: List[str] = []
    language: Optional[str] = None


class VideoUploadResponse(BaseModel):
    """Response for video upload."""
    video_id: str
    blob_url: str
    message: str


class VideoListResponse(BaseModel):
    """Response for listing videos."""
    videos: List[Video]
    total: int


class AnalyticsData(BaseModel):
    """Analytics data model."""
    total_videos: int
    total_duration: float
    indexed_videos: int
    failed_videos: int
    top_keywords: List[Dict[str, Any]]
    top_topics: List[Dict[str, Any]]
