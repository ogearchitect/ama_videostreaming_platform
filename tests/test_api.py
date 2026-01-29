"""Test API endpoints."""
import pytest
from fastapi.testclient import TestClient
from src.main import app


client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Azure Video Streaming Platform"
    assert "services" in data
    assert "endpoints" in data


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data


def test_list_videos_empty():
    """Test listing videos when empty."""
    response = client.get("/api/videos")
    assert response.status_code == 200
    data = response.json()
    assert "videos" in data
    assert "total" in data


def test_get_nonexistent_video():
    """Test getting a video that doesn't exist."""
    response = client.get("/api/videos/nonexistent-id")
    assert response.status_code == 404


def test_analytics_front_door_config():
    """Test getting Front Door configuration."""
    response = client.get("/api/analytics/front-door")
    assert response.status_code == 200
    data = response.json()
    assert "configuration" in data
    assert "cache_policy" in data
