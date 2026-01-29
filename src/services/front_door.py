"""Azure Front Door configuration and management."""
from typing import Dict, Any, Optional
from src.config import settings


class FrontDoorService:
    """Service for Azure Front Door integration."""
    
    def __init__(self):
        """Initialize the Front Door service."""
        self.endpoint = settings.azure_front_door_endpoint
    
    def get_cdn_url(self, blob_url: str) -> str:
        """
        Convert a blob URL to a Front Door CDN URL.
        
        Args:
            blob_url: Original blob storage URL
            
        Returns:
            CDN URL through Front Door
        """
        if not self.endpoint:
            # If Front Door is not configured, return original URL
            return blob_url
        
        # Extract the blob path from the storage URL
        # Example: https://account.blob.core.windows.net/container/path/file.mp4
        # Extract: /container/path/file.mp4
        parts = blob_url.split('.blob.core.windows.net/')
        if len(parts) > 1:
            blob_path = parts[1]
            cdn_url = f"{self.endpoint}/{blob_path}"
            return cdn_url
        
        return blob_url
    
    def get_streaming_url(self, video_id: str, filename: str) -> str:
        """
        Get the streaming URL for a video through Front Door.
        
        Args:
            video_id: Video identifier
            filename: Video filename
            
        Returns:
            Streaming URL
        """
        if not self.endpoint:
            raise ValueError("Front Door endpoint not configured")
        
        # Construct the streaming URL
        streaming_path = f"videos/{video_id}/{filename}"
        streaming_url = f"{self.endpoint}/{streaming_path}"
        
        return streaming_url
    
    def get_configuration(self) -> Dict[str, Any]:
        """
        Get Front Door configuration details.
        
        Returns:
            Configuration dictionary
        """
        return {
            'endpoint': self.endpoint,
            'cdn_enabled': bool(self.endpoint),
            'features': {
                'global_load_balancing': True,
                'ssl_offloading': True,
                'url_routing': True,
                'caching': True,
                'waf_protection': True,
                'compression': True
            }
        }
    
    def get_cache_policy(self) -> Dict[str, Any]:
        """
        Get recommended caching policy for video content.
        
        Returns:
            Cache policy configuration
        """
        return {
            'query_string_caching_behavior': 'IgnoreQueryString',
            'caching_behavior': 'Override',
            'cache_duration': '7.00:00:00',  # 7 days
            'compression_enabled': True,
            'content_types_to_compress': [
                'video/mp4',
                'video/webm',
                'video/ogg',
                'application/dash+xml',
                'application/vnd.apple.mpegurl'
            ]
        }


# Singleton instance
front_door_service = FrontDoorService()
