"""Azure Video Indexer service for AI-powered video analysis."""
import json
import time
from typing import Optional, Dict, Any
import requests
from src.config import settings
from src.models.video import VideoInsights


class VideoIndexerService:
    """Service for Azure Video Indexer integration."""
    
    def __init__(self):
        """Initialize the Video Indexer service."""
        self.account_id = settings.azure_video_indexer_account_id
        self.location = settings.azure_video_indexer_location
        self.subscription_key = settings.azure_video_indexer_subscription_key
        self.api_url = f"https://api.videoindexer.ai"
        self.access_token = None
    
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
        return self.access_token
    
    async def upload_video(self, video_url: str, video_name: str, video_id: str) -> str:
        """
        Upload and index a video from a URL.
        
        Args:
            video_url: URL of the video to index
            video_name: Name of the video
            video_id: Unique identifier for the video
            
        Returns:
            Video Indexer video ID
        """
        if not self.access_token:
            self.get_access_token()
        
        url = f"{self.api_url}/{self.location}/Accounts/{self.account_id}/Videos"
        
        params = {
            'accessToken': self.access_token,
            'name': video_name,
            'videoUrl': video_url,
            'externalId': video_id,
            'privacy': 'Private'
        }
        
        response = requests.post(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        return result.get('id')
    
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
        
        return response.json()
    
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
        return result.get('state', 'Unknown')
    
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
        return response.status_code == 204


# Singleton instance
video_indexer_service = VideoIndexerService()
