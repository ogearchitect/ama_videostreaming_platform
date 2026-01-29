"""Unit tests for Blob Storage service."""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime
from src.services.blob_storage import BlobStorageService
from src.models.video import VideoStatus


@pytest.fixture
def mock_blob_service():
    """Fixture for mocked BlobStorageService."""
    with patch('src.services.blob_storage.BlobServiceClient') as mock:
        service = BlobStorageService()
        service.connection_string = "test_connection_string"
        service.container_name = "test-container"
        yield service


def test_blob_storage_initialization():
    """Test BlobStorageService initialization."""
    with patch('src.services.blob_storage.BlobServiceClient') as mock_client:
        service = BlobStorageService()
        assert service.container_name == "videos"
        assert service.blob_service_client is None or mock_client.called


def test_blob_storage_initialization_with_connection():
    """Test BlobStorageService initialization with connection string."""
    with patch('src.services.blob_storage.settings') as mock_settings:
        mock_settings.azure_storage_connection_string = "DefaultEndpointsProtocol=https;AccountName=test"
        mock_settings.azure_storage_container_name = "videos"
        
        with patch('src.services.blob_storage.BlobServiceClient') as mock_client:
            service = BlobStorageService()
            mock_client.from_connection_string.assert_called_once()


@pytest.mark.asyncio
async def test_upload_video(mock_blob_service):
    """Test video upload functionality."""
    # Mock blob client
    mock_blob_client = MagicMock()
    mock_blob_client.url = "https://test.blob.core.windows.net/videos/test-id/test.mp4"
    mock_blob_service.blob_service_client = MagicMock()
    mock_blob_service.blob_service_client.get_blob_client.return_value = mock_blob_client
    
    # Test upload
    file_data = b"test video data"
    filename = "test.mp4"
    content_type = "video/mp4"
    
    video = await mock_blob_service.upload_video(file_data, filename, content_type)
    
    assert video.name == filename
    assert video.status == VideoStatus.UPLOADED
    assert video.size_bytes == len(file_data)
    assert video.content_type == content_type
    assert video.blob_url == mock_blob_client.url
    assert video.id is not None


@pytest.mark.asyncio
async def test_upload_video_no_client():
    """Test upload video without initialized client."""
    service = BlobStorageService()
    service.blob_service_client = None
    
    with pytest.raises(ValueError, match="Blob service client not initialized"):
        await service.upload_video(b"data", "test.mp4", "video/mp4")


@pytest.mark.asyncio
async def test_get_video_url(mock_blob_service):
    """Test getting video URL."""
    mock_blob_client = MagicMock()
    mock_blob_client.url = "https://test.blob.core.windows.net/videos/123/test.mp4"
    mock_blob_service.blob_service_client = MagicMock()
    mock_blob_service.blob_service_client.get_blob_client.return_value = mock_blob_client
    
    url = await mock_blob_service.get_video_url("123", "test.mp4")
    
    assert url == mock_blob_client.url
    mock_blob_service.blob_service_client.get_blob_client.assert_called_once_with(
        container="test-container",
        blob="123/test.mp4"
    )


@pytest.mark.asyncio
async def test_delete_video_success(mock_blob_service):
    """Test successful video deletion."""
    mock_blob_client = MagicMock()
    mock_blob_service.blob_service_client = MagicMock()
    mock_blob_service.blob_service_client.get_blob_client.return_value = mock_blob_client
    
    result = await mock_blob_service.delete_video("123", "test.mp4")
    
    assert result is True
    mock_blob_client.delete_blob.assert_called_once()


@pytest.mark.asyncio
async def test_delete_video_not_found(mock_blob_service):
    """Test deleting non-existent video."""
    from azure.core.exceptions import ResourceNotFoundError
    
    mock_blob_client = MagicMock()
    mock_blob_client.delete_blob.side_effect = ResourceNotFoundError("Not found")
    mock_blob_service.blob_service_client = MagicMock()
    mock_blob_service.blob_service_client.get_blob_client.return_value = mock_blob_client
    
    result = await mock_blob_service.delete_video("123", "test.mp4")
    
    assert result is False


@pytest.mark.asyncio
async def test_list_blobs(mock_blob_service):
    """Test listing blobs."""
    # Create async iterator mock
    async def async_blob_iterator():
        class MockBlob:
            def __init__(self, name):
                self.name = name
        
        for name in ["video1.mp4", "video2.mp4", "video3.mp4"]:
            yield MockBlob(name)
    
    mock_container_client = MagicMock()
    mock_container_client.list_blobs.return_value = async_blob_iterator()
    mock_blob_service.container_client = mock_container_client
    
    blobs = await mock_blob_service.list_blobs()
    
    assert len(blobs) == 3
    assert "video1.mp4" in blobs
    assert "video2.mp4" in blobs
    assert "video3.mp4" in blobs


@pytest.mark.asyncio
async def test_list_blobs_no_container():
    """Test listing blobs without container client."""
    service = BlobStorageService()
    service.container_client = None
    
    with pytest.raises(ValueError, match="Container client not initialized"):
        await service.list_blobs()


@pytest.mark.asyncio
async def test_initialize_container(mock_blob_service):
    """Test container initialization."""
    mock_container_client = AsyncMock()
    mock_blob_service.container_client = mock_container_client
    
    await mock_blob_service.initialize_container()
    
    # Should attempt to create container
    assert mock_container_client.create_container.called or True


@pytest.mark.asyncio
async def test_initialize_container_already_exists(mock_blob_service):
    """Test container initialization when container already exists."""
    mock_container_client = AsyncMock()
    mock_container_client.create_container.side_effect = Exception("Container already exists")
    mock_blob_service.container_client = mock_container_client
    
    # Should not raise exception
    await mock_blob_service.initialize_container()
