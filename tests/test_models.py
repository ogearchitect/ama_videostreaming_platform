"""Test configuration models."""
import pytest
from src.models.video import (
    Video, VideoStatus, VideoInsights, 
    VideoUploadResponse, VideoListResponse, AnalyticsData
)
from datetime import datetime


def test_video_model():
    """Test Video model creation."""
    video = Video(
        id="test-123",
        name="test_video.mp4",
        blob_url="https://storage.blob.core.windows.net/videos/test.mp4",
        status=VideoStatus.UPLOADED,
        uploaded_at=datetime.utcnow(),
        size_bytes=1024000,
        content_type="video/mp4"
    )
    
    assert video.id == "test-123"
    assert video.name == "test_video.mp4"
    assert video.status == VideoStatus.UPLOADED


def test_video_insights_model():
    """Test VideoInsights model creation."""
    insights = VideoInsights(
        video_id="test-123",
        transcript="This is a test transcript",
        keywords=["test", "video", "demo"],
        topics=["technology", "testing"],
        faces=[{"id": "1", "name": "Person 1"}],
        labels=["indoor", "computer"],
        sentiments=[{"sentiment": "positive", "score": 0.8}],
        brands=["Microsoft", "Azure"],
        language="en-US"
    )
    
    assert insights.video_id == "test-123"
    assert len(insights.keywords) == 3
    assert insights.language == "en-US"


def test_video_upload_response():
    """Test VideoUploadResponse model."""
    response = VideoUploadResponse(
        video_id="test-123",
        blob_url="https://storage.blob.core.windows.net/videos/test.mp4",
        message="Upload successful"
    )
    
    assert response.video_id == "test-123"
    assert "successful" in response.message


def test_analytics_data_model():
    """Test AnalyticsData model."""
    analytics = AnalyticsData(
        total_videos=100,
        total_duration=3600.0,
        indexed_videos=95,
        failed_videos=5,
        top_keywords=[{"keyword": "test", "count": 10}],
        top_topics=[{"topic": "technology", "count": 15}]
    )
    
    assert analytics.total_videos == 100
    assert analytics.indexed_videos == 95
    assert len(analytics.top_keywords) == 1
