"""Unit tests for Front Door service."""
import pytest
from unittest.mock import patch
from src.services.front_door import FrontDoorService


@pytest.fixture
def front_door_service():
    """Fixture for FrontDoorService."""
    with patch('src.services.front_door.settings') as mock_settings:
        mock_settings.azure_front_door_endpoint = "https://mycdn.azurefd.net"
        service = FrontDoorService()
        yield service


@pytest.fixture
def front_door_service_no_endpoint():
    """Fixture for FrontDoorService without endpoint."""
    with patch('src.services.front_door.settings') as mock_settings:
        mock_settings.azure_front_door_endpoint = ""
        service = FrontDoorService()
        yield service


def test_front_door_initialization(front_door_service):
    """Test FrontDoorService initialization."""
    assert front_door_service.endpoint == "https://mycdn.azurefd.net"


def test_front_door_initialization_no_endpoint(front_door_service_no_endpoint):
    """Test FrontDoorService initialization without endpoint."""
    assert front_door_service_no_endpoint.endpoint == ""


def test_get_cdn_url_success(front_door_service):
    """Test successful CDN URL generation."""
    blob_url = "https://mystorageaccount.blob.core.windows.net/videos/test-id/video.mp4"
    
    cdn_url = front_door_service.get_cdn_url(blob_url)
    
    assert cdn_url == "https://mycdn.azurefd.net/videos/test-id/video.mp4"


def test_get_cdn_url_no_endpoint(front_door_service_no_endpoint):
    """Test CDN URL generation without endpoint configured."""
    blob_url = "https://mystorageaccount.blob.core.windows.net/videos/test-id/video.mp4"
    
    cdn_url = front_door_service_no_endpoint.get_cdn_url(blob_url)
    
    # Should return original URL when Front Door not configured
    assert cdn_url == blob_url


def test_get_cdn_url_invalid_blob_url(front_door_service):
    """Test CDN URL generation with invalid blob URL."""
    invalid_url = "https://example.com/video.mp4"
    
    cdn_url = front_door_service.get_cdn_url(invalid_url)
    
    # Should return original URL if parsing fails
    assert cdn_url == invalid_url


def test_get_streaming_url_success(front_door_service):
    """Test successful streaming URL generation."""
    video_id = "test-video-123"
    filename = "video.mp4"
    
    streaming_url = front_door_service.get_streaming_url(video_id, filename)
    
    assert streaming_url == "https://mycdn.azurefd.net/videos/test-video-123/video.mp4"


def test_get_streaming_url_no_endpoint(front_door_service_no_endpoint):
    """Test streaming URL generation without endpoint."""
    video_id = "test-video-123"
    filename = "video.mp4"
    
    with pytest.raises(ValueError, match="Front Door endpoint not configured"):
        front_door_service_no_endpoint.get_streaming_url(video_id, filename)


def test_get_configuration(front_door_service):
    """Test getting Front Door configuration."""
    config = front_door_service.get_configuration()
    
    assert config["endpoint"] == "https://mycdn.azurefd.net"
    assert config["cdn_enabled"] is True
    assert "features" in config
    assert config["features"]["global_load_balancing"] is True
    assert config["features"]["ssl_offloading"] is True
    assert config["features"]["caching"] is True


def test_get_configuration_no_endpoint(front_door_service_no_endpoint):
    """Test getting configuration without endpoint."""
    config = front_door_service_no_endpoint.get_configuration()
    
    assert config["endpoint"] == ""
    assert config["cdn_enabled"] is False
    assert "features" in config


def test_get_cache_policy(front_door_service):
    """Test getting cache policy."""
    cache_policy = front_door_service.get_cache_policy()
    
    assert "query_string_caching_behavior" in cache_policy
    assert cache_policy["query_string_caching_behavior"] == "IgnoreQueryString"
    assert cache_policy["caching_behavior"] == "Override"
    assert cache_policy["cache_duration"] == "7.00:00:00"
    assert cache_policy["compression_enabled"] is True
    assert "content_types_to_compress" in cache_policy
    assert "video/mp4" in cache_policy["content_types_to_compress"]


def test_get_cdn_url_with_different_storage_accounts(front_door_service):
    """Test CDN URL generation with different storage account names."""
    test_cases = [
        (
            "https://storage1.blob.core.windows.net/container/file.mp4",
            "https://mycdn.azurefd.net/container/file.mp4"
        ),
        (
            "https://anotherstorage.blob.core.windows.net/videos/123/test.mp4",
            "https://mycdn.azurefd.net/videos/123/test.mp4"
        ),
    ]
    
    for blob_url, expected_cdn_url in test_cases:
        cdn_url = front_door_service.get_cdn_url(blob_url)
        assert cdn_url == expected_cdn_url


def test_get_streaming_url_with_special_characters(front_door_service):
    """Test streaming URL with special characters in filename."""
    video_id = "video-123"
    filename = "my video (2024).mp4"
    
    streaming_url = front_door_service.get_streaming_url(video_id, filename)
    
    assert streaming_url == "https://mycdn.azurefd.net/videos/video-123/my video (2024).mp4"


def test_cache_policy_video_formats(front_door_service):
    """Test that cache policy includes all common video formats."""
    cache_policy = front_door_service.get_cache_policy()
    
    video_formats = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "application/dash+xml",
        "application/vnd.apple.mpegurl"
    ]
    
    for format in video_formats:
        assert format in cache_policy["content_types_to_compress"]
