"""Unit tests for Video Indexer service."""
import pytest
from unittest.mock import Mock, MagicMock, patch
import requests
from src.services.video_indexer import VideoIndexerService


@pytest.fixture
def mock_video_indexer():
    """Fixture for mocked VideoIndexerService."""
    with patch('src.services.video_indexer.settings') as mock_settings:
        mock_settings.azure_video_indexer_account_id = "test-account-id"
        mock_settings.azure_video_indexer_location = "eastus"
        mock_settings.azure_video_indexer_subscription_key = "test-key"
        mock_settings.azure_video_indexer_streaming_preset = "Default"
        service = VideoIndexerService()
        yield service


def test_video_indexer_initialization():
    """Test VideoIndexerService initialization."""
    with patch('src.services.video_indexer.settings') as mock_settings:
        mock_settings.azure_video_indexer_account_id = "account123"
        mock_settings.azure_video_indexer_location = "westus"
        mock_settings.azure_video_indexer_subscription_key = "key123"
        mock_settings.azure_video_indexer_streaming_preset = "Default"
        
        service = VideoIndexerService()
        
        assert service.account_id == "account123"
        assert service.location == "westus"
        assert service.subscription_key == "key123"
        assert service.streaming_preset == "Default"
        assert service.api_url == "https://api.videoindexer.ai"
        assert service.access_token is None


def test_get_access_token_success(mock_video_indexer):
    """Test successful access token retrieval."""
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = "test-access-token"
        mock_get.return_value = mock_response
        
        token = mock_video_indexer.get_access_token()
        
        assert token == "test-access-token"
        assert mock_video_indexer.access_token == "test-access-token"
        mock_get.assert_called_once()


def test_get_access_token_missing_credentials():
    """Test access token retrieval with missing credentials."""
    with patch('src.services.video_indexer.settings') as mock_settings:
        mock_settings.azure_video_indexer_account_id = ""
        mock_settings.azure_video_indexer_location = "eastus"
        mock_settings.azure_video_indexer_subscription_key = ""
        
        service = VideoIndexerService()
        
        with pytest.raises(ValueError, match="Video Indexer credentials not configured"):
            service.get_access_token()


@pytest.mark.asyncio
async def test_upload_video_success(mock_video_indexer):
    """Test successful video upload."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.post') as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "indexer-video-123"}
        mock_post.return_value = mock_response
        
        result = await mock_video_indexer.upload_video(
            "https://test.blob.core.windows.net/video.mp4",
            "test_video.mp4",
            "video-id-123"
        )
        
        assert result == "indexer-video-123"
        mock_post.assert_called_once()
        
        # Verify call parameters including CMAF streaming preset
        call_args = mock_post.call_args
        assert "accessToken" in call_args[1]["params"]
        assert call_args[1]["params"]["name"] == "test_video.mp4"
        assert call_args[1]["params"]["externalId"] == "video-id-123"
        assert "streamingPreset" in call_args[1]["params"]
        assert call_args[1]["params"]["streamingPreset"] == "Default"  # CMAF by default


@pytest.mark.asyncio
async def test_upload_video_no_token(mock_video_indexer):
    """Test video upload without access token."""
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = "new-token"
        mock_get.return_value = mock_response
        
        with patch('src.services.video_indexer.requests.post') as mock_post:
            mock_post_response = MagicMock()
            mock_post_response.json.return_value = {"id": "new-video-id"}
            mock_post.return_value = mock_post_response
            
            result = await mock_video_indexer.upload_video(
                "https://test.blob.core.windows.net/video.mp4",
                "test.mp4",
                "123"
            )
            
            assert result == "new-video-id"
            # Should have obtained token first
            mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_get_video_index(mock_video_indexer):
    """Test getting video index."""
    mock_video_indexer.access_token = "test-token"
    
    expected_data = {
        "videos": [{
            "insights": {
                "transcript": [{"text": "Hello world"}],
                "keywords": [{"name": "test"}],
                "topics": [{"name": "technology"}]
            }
        }]
    }
    
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = expected_data
        mock_get.return_value = mock_response
        
        result = await mock_video_indexer.get_video_index("video-123")
        
        assert result == expected_data
        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_get_video_insights(mock_video_indexer):
    """Test extracting video insights."""
    mock_video_indexer.access_token = "test-token"
    
    index_data = {
        "videos": [{
            "insights": {
                "transcript": [
                    {"text": "Hello"},
                    {"text": "world"}
                ],
                "keywords": [
                    {"name": "keyword1"},
                    {"name": "keyword2"}
                ],
                "topics": [
                    {"name": "topic1"}
                ],
                "faces": [
                    {"id": "1", "name": "Person1"}
                ],
                "labels": [
                    {"name": "label1"}
                ],
                "sentiments": [
                    {"sentimentType": "Positive", "averageScore": 0.8}
                ],
                "brands": [
                    {"name": "brand1"}
                ],
                "sourceLanguage": "en-US"
            }
        }]
    }
    
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = index_data
        mock_get.return_value = mock_response
        
        insights = await mock_video_indexer.get_video_insights("indexer-video-123", "video-123")
        
        assert insights.video_id == "video-123"
        assert insights.transcript == "Hello world"
        assert len(insights.keywords) == 2
        assert "keyword1" in insights.keywords
        assert len(insights.topics) == 1
        assert len(insights.faces) == 1
        assert insights.language == "en-US"


@pytest.mark.asyncio
async def test_check_indexing_status(mock_video_indexer):
    """Test checking indexing status."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = {"state": "Processed"}
        mock_get.return_value = mock_response
        
        status = await mock_video_indexer.check_indexing_status("video-123")
        
        assert status == "Processed"


@pytest.mark.asyncio
async def test_delete_video_success(mock_video_indexer):
    """Test successful video deletion."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.delete') as mock_delete:
        mock_response = MagicMock()
        mock_response.status_code = 204
        mock_delete.return_value = mock_response
        
        result = await mock_video_indexer.delete_video("video-123")
        
        assert result is True


@pytest.mark.asyncio
async def test_delete_video_failure(mock_video_indexer):
    """Test failed video deletion."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.delete') as mock_delete:
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_delete.return_value = mock_response
        
        result = await mock_video_indexer.delete_video("video-123")
        
        assert result is False


def test_video_indexer_api_url_construction(mock_video_indexer):
    """Test API URL construction."""
    expected_base = "https://api.videoindexer.ai"
    assert mock_video_indexer.api_url == expected_base


@pytest.mark.asyncio
async def test_get_video_insights_empty_data(mock_video_indexer):
    """Test extracting insights from empty data."""
    mock_video_indexer.access_token = "test-token"
    
    index_data = {
        "videos": [{
            "insights": {}
        }]
    }
    
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = index_data
        mock_get.return_value = mock_response
        
        insights = await mock_video_indexer.get_video_insights("indexer-video-123", "video-123")
        
        assert insights.video_id == "video-123"
        assert insights.transcript == ""
        assert len(insights.keywords) == 0
        assert len(insights.topics) == 0
        assert insights.language == "en-US"  # default


@pytest.mark.asyncio
async def test_upload_video_with_cmaf_preset(mock_video_indexer):
    """Test video upload with CMAF streaming preset."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.post') as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "indexer-video-456"}
        mock_post.return_value = mock_response
        
        result = await mock_video_indexer.upload_video(
            "https://test.blob.core.windows.net/video.mp4",
            "test_video.mp4",
            "video-id-456",
            streaming_preset="Default"
        )
        
        assert result == "indexer-video-456"
        
        # Verify streamingPreset parameter was included
        call_args = mock_post.call_args
        assert "streamingPreset" in call_args[1]["params"]
        assert call_args[1]["params"]["streamingPreset"] == "Default"


@pytest.mark.asyncio
async def test_upload_video_with_custom_preset(mock_video_indexer):
    """Test video upload with custom streaming preset."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.post') as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "indexer-video-789"}
        mock_post.return_value = mock_response
        
        result = await mock_video_indexer.upload_video(
            "https://test.blob.core.windows.net/video.mp4",
            "test_video.mp4",
            "video-id-789",
            streaming_preset="SingleBitrate"
        )
        
        assert result == "indexer-video-789"
        
        # Verify custom streamingPreset parameter
        call_args = mock_post.call_args
        assert call_args[1]["params"]["streamingPreset"] == "SingleBitrate"


@pytest.mark.asyncio
async def test_get_streaming_url(mock_video_indexer):
    """Test getting CMAF streaming URL."""
    mock_video_indexer.access_token = "test-token"
    
    with patch('src.services.video_indexer.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = "https://streaming.videoindexer.ai/video-123/manifest.ism"
        mock_get.return_value = mock_response
        
        result = await mock_video_indexer.get_streaming_url("video-123")
        
        assert "streaming_url" in result
        assert result["format"] == "CMAF"
        assert "HLS" in result["supports"]
        assert "DASH" in result["supports"]
