"""Azure Video Indexer service for AI-powered video analysis."""
import json
import time
from typing import Optional, Dict, Any
import requests
from src.config import settings
from src.models.video import VideoInsights
from src.utils.logging import azure_logger, log_azure_operation


# Initialize logger for this service
logger = azure_logger.get_logger(__name__, 'video_indexer')


class VideoIndexerService:
    """Service for Azure Video Indexer integration."""
    
    def __init__(self):
        """Initialize the Video Indexer service."""
        self.account_id = settings.azure_video_indexer_account_id
        self.location = settings.azure_video_indexer_location
        self.subscription_key = settings.azure_video_indexer_subscription_key
        self.streaming_preset = settings.azure_video_indexer_streaming_preset
        self.api_url = f"https://api.videoindexer.ai"
        self.access_token = None
        
        logger.info("Video Indexer service initialized", extra={
            'service': 'video_indexer',
            'operation': 'initialize',
            'location': self.location,
            'streaming_preset': self.streaming_preset,
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('video_indexer', 'get_access_token')
    def get_access_token(self) -> str:
        """
        Get access token for Video Indexer API.
        
        Returns:
            Access token string
        """
        if not self.subscription_key or not self.account_id:
            raise ValueError("Video Indexer credentials not configured")
        
        url = f"{self.api_url}/auth/{self.location}/Accounts/{self.account_id}/AccessToken"
        
        headers = {
            'Ocp-Apim-Subscription-Key': self.subscription_key
        }
        
        params = {
            'allowEdit': 'true'
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        self.access_token = response.json()
        
        logger.info("Access token obtained", extra={
            'service': 'video_indexer',
            'operation': 'get_access_token',
            'duration_ms': 0,
            'status': 'success'
        })
        
        return self.access_token
    
    @log_azure_operation('video_indexer', 'upload_video')
    async def upload_video(self, video_url: str, video_name: str, video_id: str, 
                          streaming_preset: Optional[str] = None) -> str:
        """
        Upload and index a video from a URL with CMAF encoding support.
        
        Args:
            video_url: URL of the video to index
            video_name: Name of the video
            video_id: Unique identifier for the video
            streaming_preset: Streaming format preset (Default, SingleBitrate, NoStreaming)
                            Default uses CMAF for adaptive bitrate streaming
            
        Returns:
            Video Indexer video ID
        """
        if not self.access_token:
            self.get_access_token()
        
        # Use provided streaming preset or fall back to configured default
        preset = streaming_preset or self.streaming_preset
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos"
        
        params = {
            'accessToken': self.access_token,
            'name': video_name,
            'videoUrl': video_url,
            'externalId': video_id,
            'privacy': 'Private',
            'streamingPreset': preset  # Enable CMAF encoding
        }
        
        response = requests.post(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        indexer_video_id = result.get('id')
        
        logger.info(f"Video uploaded to Video Indexer: {video_name}", extra={
            'service': 'video_indexer',
            'operation': 'upload',
            'video_id': video_id,
            'indexer_video_id': indexer_video_id,
            'video_name': video_name,
            'streaming_preset': preset,
            'duration_ms': 0,
            'status': 'success'
        })
        
        return indexer_video_id
    
    @log_azure_operation('video_indexer', 'get_video_index')
    async def get_video_index(self, indexer_video_id: str) -> Dict[str, Any]:
        """
        Get the indexing results for a video.
        
        Args:
            indexer_video_id: Video Indexer video ID
            
        Returns:
            Indexing results dictionary
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos/{indexer_video_id}/Index"
        
        params = {
            'accessToken': self.access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        index_data = response.json()
        
        logger.info(f"Retrieved video index", extra={
            'service': 'video_indexer',
            'operation': 'get_index',
            'indexer_video_id': indexer_video_id,
            'duration_ms': 0,
            'status': 'success'
        })
        
        return index_data
    
    @log_azure_operation('video_indexer', 'get_video_insights')
    async def get_video_insights(self, indexer_video_id: str, video_id: str) -> VideoInsights:
        """
        Extract insights from an indexed video.
        
        Args:
            indexer_video_id: Video Indexer video ID
            video_id: Our internal video ID
            
        Returns:
            VideoInsights model
        """
        index_data = await self.get_video_index(indexer_video_id)
        
        # Extract insights from the index
        insights = index_data.get('videos', [{}])[0].get('insights', {})
        
        # Extract transcript
        transcript_items = insights.get('transcript', [])
        transcript = ' '.join([item.get('text', '') for item in transcript_items])
        
        # Extract keywords
        keywords_data = insights.get('keywords', [])
        keywords = [kw.get('name', '') for kw in keywords_data]
        
        # Extract topics
        topics_data = insights.get('topics', [])
        topics = [topic.get('name', '') for topic in topics_data]
        
        # Extract faces
        faces_data = insights.get('faces', [])
        faces = [{'id': face.get('id'), 'name': face.get('name')} for face in faces_data]
        
        # Extract labels
        labels_data = insights.get('labels', [])
        labels = [label.get('name', '') for label in labels_data]
        
        # Extract sentiments
        sentiments_data = insights.get('sentiments', [])
        sentiments = [
            {
                'sentiment': sent.get('sentimentType'),
                'score': sent.get('averageScore')
            }
            for sent in sentiments_data
        ]
        
        # Extract brands
        brands_data = insights.get('brands', [])
        brands = [brand.get('name', '') for brand in brands_data]
        
        # Extract language
        language = insights.get('sourceLanguage', 'en-US')
        
        logger.info(f"Extracted video insights", extra={
            'service': 'video_indexer',
            'operation': 'extract_insights',
            'video_id': video_id,
            'indexer_video_id': indexer_video_id,
            'keywords_count': len(keywords),
            'topics_count': len(topics),
            'faces_count': len(faces),
            'duration_ms': 0,
            'status': 'success'
        })
        
        # Log metrics
        azure_logger.log_metric(logger, 'video_keywords_count', len(keywords), 'video_indexer', video_id=video_id)
        azure_logger.log_metric(logger, 'video_topics_count', len(topics), 'video_indexer', video_id=video_id)
        azure_logger.log_metric(logger, 'video_faces_count', len(faces), 'video_indexer', video_id=video_id)
        
        return VideoInsights(
            video_id=video_id,
            transcript=transcript,
            keywords=keywords,
            topics=topics,
            faces=faces,
            labels=labels,
            sentiments=sentiments,
            brands=brands,
            language=language
        )
    
    @log_azure_operation('video_indexer', 'check_indexing_status')
    async def check_indexing_status(self, indexer_video_id: str) -> str:
        """
        Check the indexing status of a video.
        
        Args:
            indexer_video_id: Video Indexer video ID
            
        Returns:
            Status string (Uploaded, Processing, Processed, Failed)
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos/{indexer_video_id}/Index"
        
        params = {
            'accessToken': self.access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        status = result.get('state', 'Unknown')
        
        logger.info(f"Indexing status: {status}", extra={
            'service': 'video_indexer',
            'operation': 'check_status',
            'indexer_video_id': indexer_video_id,
            'status_value': status,
            'duration_ms': 0,
            'status': 'success'
        })
        
        return status
    
    @log_azure_operation('video_indexer', 'delete_video')
    async def delete_video(self, indexer_video_id: str) -> bool:
        """
        Delete a video from Video Indexer.
        
        Args:
            indexer_video_id: Video Indexer video ID
            
        Returns:
            True if deleted successfully
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos/{indexer_video_id}"
        
        params = {
            'accessToken': self.access_token
        }
        
        response = requests.delete(url, params=params)
        success = response.status_code == 204
        
        logger.info(f"Video deletion: {'success' if success else 'failed'}", extra={
            'service': 'video_indexer',
            'operation': 'delete',
            'indexer_video_id': indexer_video_id,
            'duration_ms': 0,
            'status': 'success' if success else 'failed'
        })
        
        return success
    
    @log_azure_operation('video_indexer', 'get_streaming_url')
    async def get_streaming_url(self, indexer_video_id: str, streaming_format: str = 'auto') -> Dict[str, str]:
        """
        Get streaming URLs for a video in CMAF format.
        
        Args:
            indexer_video_id: Video Indexer video ID
            streaming_format: Streaming format ('auto', 'HLS', 'DASH')
            
        Returns:
            Dictionary with streaming URLs for different formats
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos/{indexer_video_id}/StreamingUrl"
        
        params = {
            'accessToken': self.access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        streaming_url = response.json()
        
        logger.info(f"Retrieved streaming URL for format: {streaming_format}", extra={
            'service': 'video_indexer',
            'operation': 'get_streaming_url',
            'indexer_video_id': indexer_video_id,
            'streaming_format': streaming_format,
            'duration_ms': 0,
            'status': 'success'
        })
        
        # Return streaming information based on configured preset
        return {
            'streaming_url': streaming_url,
            'format': 'CMAF' if self.streaming_preset == 'Default' else self.streaming_preset,
            'supports': ['HLS', 'DASH'] if self.streaming_preset == 'Default' else []
        }


# Singleton instance
video_indexer_service = VideoIndexerService()
