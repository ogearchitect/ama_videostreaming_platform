"""Azure Blob Storage service for video uploads and management."""
import uuid
from typing import List, Optional
from datetime import datetime
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.core.exceptions import ResourceNotFoundError
from src.config import settings
from src.models.video import Video, VideoStatus
from src.utils.logging import azure_logger, log_azure_operation


# Initialize logger for this service
logger = azure_logger.get_logger(__name__, 'blob_storage')


class BlobStorageService:
    """Service for managing video files in Azure Blob Storage."""
    
    def __init__(self):
        """Initialize the blob storage service."""
        self.connection_string = settings.azure_storage_connection_string
        self.container_name = settings.azure_storage_container_name
        self.blob_service_client = None
        self.container_client = None
        
        if self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    self.connection_string
                )
                self.container_client = self.blob_service_client.get_container_client(
                    self.container_name
                )
                logger.info("Blob Storage service initialized", extra={
                    'service': 'blob_storage',
                    'operation': 'initialize',
                    'container_name': self.container_name,
                    'duration_ms': 0,
                    'status': 'success'
                })
            except Exception as e:
                logger.error(f"Failed to initialize Blob Storage: {str(e)}", extra={
                    'service': 'blob_storage',
                    'operation': 'initialize',
                    'duration_ms': 0,
                    'status': 'error',
                    'error': str(e),
                    'error_type': type(e).__name__
                })
                raise
    
    @log_azure_operation('blob_storage', 'initialize_container')
    async def initialize_container(self) -> None:
        """Create the container if it doesn't exist."""
        if not self.container_client:
            raise ValueError("Blob service client not initialized")
        
        try:
            await self.container_client.create_container()
            logger.info(f"Container '{self.container_name}' created", extra={
                'service': 'blob_storage',
                'operation': 'create_container',
                'container_name': self.container_name,
                'duration_ms': 0,
                'status': 'success'
            })
        except Exception:
            # Container already exists
            logger.info(f"Container '{self.container_name}' already exists", extra={
                'service': 'blob_storage',
                'operation': 'create_container',
                'container_name': self.container_name,
                'duration_ms': 0,
                'status': 'exists'
            })
    
    @log_azure_operation('blob_storage', 'upload_video')
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
        
        logger.info(f"Uploading video: {filename}", extra={
            'service': 'blob_storage',
            'operation': 'upload',
            'video_id': video_id,
            'filename': filename,
            'size_bytes': len(file_data),
            'content_type': content_type,
            'duration_ms': 0,
            'status': 'started'
        })
        
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
        
        # Log metric for upload size
        azure_logger.log_metric(
            logger,
            'video_upload_size_bytes',
            len(file_data),
            'blob_storage',
            video_id=video_id
        )
        
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
        
        logger.info(f"Video uploaded successfully: {filename}", extra={
            'service': 'blob_storage',
            'operation': 'upload',
            'video_id': video_id,
            'blob_url': blob_url,
            'duration_ms': 0,
            'status': 'success'
        })
        
        return video
    
    @log_azure_operation('blob_storage', 'get_video_url')
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
    
    @log_azure_operation('blob_storage', 'delete_video')
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
            logger.info(f"Video deleted: {filename}", extra={
                'service': 'blob_storage',
                'operation': 'delete',
                'video_id': video_id,
                'blob_name': blob_name,
                'duration_ms': 0,
                'status': 'success'
            })
            return True
        except ResourceNotFoundError:
            logger.warning(f"Video not found for deletion: {filename}", extra={
                'service': 'blob_storage',
                'operation': 'delete',
                'video_id': video_id,
                'blob_name': blob_name,
                'duration_ms': 0,
                'status': 'not_found'
            })
            return False
    
    @log_azure_operation('blob_storage', 'list_blobs')
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
        
        logger.info(f"Listed {len(blob_list)} blobs", extra={
            'service': 'blob_storage',
            'operation': 'list_blobs',
            'blob_count': len(blob_list),
            'duration_ms': 0,
            'status': 'success'
        })
        
        return blob_list


# Singleton instance
blob_storage_service = BlobStorageService()
