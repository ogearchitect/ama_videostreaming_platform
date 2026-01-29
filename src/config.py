"""Configuration management for the video streaming platform.

Security Considerations:
------------------------
1. All Azure credentials are managed via environment variables (never hardcoded)
2. Azure Managed Identity is recommended for production environments
3. Connection strings and API keys should be stored in Azure Key Vault for production
4. Environment variables are loaded from .env file for development only
5. Never commit .env files or credentials to version control

For production deployment, use Azure Managed Identity:
- Eliminates the need for connection strings and API keys
- Automatically rotates credentials
- Provides secure authentication without storing secrets
- Enable Managed Identity on Azure App Service or Azure Functions
- Grant appropriate RBAC roles to the managed identity
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables.
    
    Security Notes:
    - All credentials are sourced from environment variables
    - For production, use Azure Managed Identity instead of connection strings
    - Store sensitive configuration in Azure Key Vault
    - Ensure .env files are excluded from version control (.gitignore)
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )
    
    # Azure Storage
    # Security: Use Managed Identity in production to avoid connection strings
    # Example: DefaultAzureCredential() from azure-identity package
    azure_storage_connection_string: str = ""
    azure_storage_container_name: str = "videos"  # Videos stored in private containers
    
    # Azure Video Indexer
    # Security: Use API key for development, Managed Identity for production
    azure_video_indexer_account_id: str = ""
    azure_video_indexer_location: str = "eastus"
    azure_video_indexer_subscription_key: str = ""  # For dev only; use Managed Identity in prod
    azure_video_indexer_resource_id: str = ""
    azure_video_indexer_streaming_preset: str = "Default"  # Default, SingleBitrate, or NoStreaming
    
    # Azure Front Door
    # Security: Front Door includes WAF protection for DDoS mitigation
    azure_front_door_endpoint: str = ""
    
    # Azure Synapse
    # Security: Use connection string for dev, Managed Identity for production
    azure_synapse_workspace_name: str = ""
    azure_synapse_sql_pool_name: str = ""
    azure_synapse_connection_string: str = ""  # For dev only; use Managed Identity in prod
    
    # Azure Application Insights
    # Security: Instrumentation key is safe for client-side use (read-only)
    azure_application_insights_key: str = ""
    azure_application_insights_connection_string: str = ""
    
    # Application
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False  # Set to False in production


settings = Settings()
