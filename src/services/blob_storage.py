"""Azure Blob Storage service for video uploads and management."""
import uuid
from typing import List, Optional
from datetime import datetime
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.core.exceptions import ResourceNotFoundError
from src.config import settings
from src.models.video import Video, VideoStatus


class BlobStorageService:
    """Service for managing video files in Azure Blob Storage."""
    
    def __init__(self):
        """Initialize the blob storage service."""
        self.connection_string = settings.azure_storage_connection_string
        self.container_name = settings.azure_storage_container_name
        self.blob_service_client = None
        self.container_client = None
        
        if self.connection_string:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                self.connection_string
            )
            self.container_client = self.blob_service_client.get_container_client(
                self.container_name
            )
    
    async def initialize_container(self) -> None:
        """Create the container if it doesn't exist."""
        if not self.container_client:
            raise ValueError("Blob service client not initialized")
        
        try:
            await self.container_client.create_container()
        except Exception:
            # Container already exists
            pass
    
    async def upload_video(self, file_data: bytes, filename: str, content_type: str) -> Video:
        """
        Upload a video file to blob storage.
        
        Args:
            file_data: Video file binary data
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            Video model with upload details
        """
        if not self.blob_service_client:
            raise ValueError("Blob service client not initialized")
        
        # Generate unique video ID
        video_id = str(uuid.uuid4())
        blob_name = f"{video_id}/{filename}"
        
        # Upload to blob storage
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )
        
        blob_client.upload_blob(
            file_data,
            content_settings={
                'content_type': content_type
            },
            overwrite=True
        )
        
        # Get blob URL
        blob_url = blob_client.url
        
        # Create video model
        video = Video(
            id=video_id,
            name=filename,
            blob_url=blob_url,
            status=VideoStatus.UPLOADED,
            uploaded_at=datetime.utcnow(),
            size_bytes=len(file_data),
            content_type=content_type
        )
        
        return video
    
    async def get_video_url(self, video_id: str, filename: str) -> str:
        """
        Get the URL for a video.
        
        Args:
            video_id: Unique video identifier
            filename: Video filename
            
        Returns:
            Blob URL
        """
        if not self.blob_service_client:
            raise ValueError("Blob service client not initialized")
        
        blob_name = f"{video_id}/{filename}"
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )
        
        return blob_client.url
    
    async def delete_video(self, video_id: str, filename: str) -> bool:
        """
        Delete a video from blob storage.
        
        Args:
            video_id: Unique video identifier
            filename: Video filename
            
        Returns:
            True if deleted successfully
        """
        if not self.blob_service_client:
            raise ValueError("Blob service client not initialized")
        
        blob_name = f"{video_id}/{filename}"
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )
        
        try:
            blob_client.delete_blob()
            return True
        except ResourceNotFoundError:
            return False
    
    async def list_blobs(self) -> List[str]:
        """
        List all blobs in the container.
        
        Returns:
            List of blob names
        """
        if not self.container_client:
            raise ValueError("Container client not initialized")
        
        blob_list = []
        async for blob in self.container_client.list_blobs():
            blob_list.append(blob.name)
        
        return blob_list


# Singleton instance
blob_storage_service = BlobStorageService()
