"""Configuration management for the video streaming platform."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )
    
    # Azure Storage
    azure_storage_connection_string: str = ""
    azure_storage_container_name: str = "videos"
    
    # Azure Video Indexer
    azure_video_indexer_account_id: str = ""
    azure_video_indexer_location: str = "eastus"
    azure_video_indexer_subscription_key: str = ""
    azure_video_indexer_resource_id: str = ""
    
    # Azure Front Door
    azure_front_door_endpoint: str = ""
    
    # Azure Synapse
    azure_synapse_workspace_name: str = ""
    azure_synapse_sql_pool_name: str = ""
    azure_synapse_connection_string: str = ""
    
    # Azure Application Insights
    azure_application_insights_key: str = ""
    azure_application_insights_connection_string: str = ""
    
    # Application
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False


settings = Settings()
