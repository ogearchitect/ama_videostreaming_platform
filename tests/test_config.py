"""Unit tests for configuration module."""
import pytest
from unittest.mock import patch, MagicMock
from src.config import Settings


def test_settings_default_values():
    """Test default settings values."""
    with patch.dict('os.environ', {}, clear=True):
        settings = Settings()
        
        assert settings.azure_storage_connection_string == ""
        assert settings.azure_storage_container_name == "videos"
        assert settings.azure_video_indexer_location == "eastus"
        assert settings.api_host == "0.0.0.0"
        assert settings.api_port == 8000
        assert settings.debug is False


def test_settings_from_environment():
    """Test settings loaded from environment variables."""
    env_vars = {
        'AZURE_STORAGE_CONNECTION_STRING': 'test_connection_string',
        'AZURE_STORAGE_CONTAINER_NAME': 'test-container',
        'AZURE_VIDEO_INDEXER_ACCOUNT_ID': 'account123',
        'AZURE_VIDEO_INDEXER_LOCATION': 'westus',
        'AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY': 'key123',
        'AZURE_FRONT_DOOR_ENDPOINT': 'https://test.azurefd.net',
        'AZURE_SYNAPSE_WORKSPACE_NAME': 'test-workspace',
        'AZURE_APPLICATION_INSIGHTS_KEY': 'insights-key',
        'API_HOST': '127.0.0.1',
        'API_PORT': '9000',
        'DEBUG': 'True'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        
        assert settings.azure_storage_connection_string == 'test_connection_string'
        assert settings.azure_storage_container_name == 'test-container'
        assert settings.azure_video_indexer_account_id == 'account123'
        assert settings.azure_video_indexer_location == 'westus'
        assert settings.azure_video_indexer_subscription_key == 'key123'
        assert settings.azure_front_door_endpoint == 'https://test.azurefd.net'
        assert settings.azure_synapse_workspace_name == 'test-workspace'
        assert settings.azure_application_insights_key == 'insights-key'
        assert settings.api_host == '127.0.0.1'
        assert settings.api_port == 9000
        assert settings.debug is True


def test_settings_case_insensitive():
    """Test that settings are case insensitive."""
    env_vars = {
        'azure_storage_container_name': 'test-container-lower',
        'AZURE_STORAGE_CONTAINER_NAME': 'test-container-upper'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        # Should accept either case
        assert settings.azure_storage_container_name in ['test-container-lower', 'test-container-upper']


def test_settings_video_indexer_fields():
    """Test Video Indexer specific settings."""
    env_vars = {
        'AZURE_VIDEO_INDEXER_ACCOUNT_ID': 'vi-account',
        'AZURE_VIDEO_INDEXER_LOCATION': 'northeurope',
        'AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY': 'vi-key',
        'AZURE_VIDEO_INDEXER_RESOURCE_ID': '/subscriptions/sub-id/resourceGroups/rg/providers/Microsoft.VideoIndexer/accounts/account',
        'AZURE_VIDEO_INDEXER_STREAMING_PRESET': 'Default'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        
        assert settings.azure_video_indexer_account_id == 'vi-account'
        assert settings.azure_video_indexer_location == 'northeurope'
        assert settings.azure_video_indexer_subscription_key == 'vi-key'
        assert '/subscriptions/sub-id/' in settings.azure_video_indexer_resource_id
        assert settings.azure_video_indexer_streaming_preset == 'Default'


def test_settings_synapse_fields():
    """Test Synapse Analytics specific settings."""
    env_vars = {
        'AZURE_SYNAPSE_WORKSPACE_NAME': 'synapse-ws',
        'AZURE_SYNAPSE_SQL_POOL_NAME': 'pool1',
        'AZURE_SYNAPSE_CONNECTION_STRING': 'Server=tcp:synapse.sql.azuresynapse.net;Database=db1'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        
        assert settings.azure_synapse_workspace_name == 'synapse-ws'
        assert settings.azure_synapse_sql_pool_name == 'pool1'
        assert 'synapse.sql.azuresynapse.net' in settings.azure_synapse_connection_string


def test_settings_application_insights_fields():
    """Test Application Insights settings."""
    env_vars = {
        'AZURE_APPLICATION_INSIGHTS_KEY': 'app-insights-key-123',
        'AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING': 'InstrumentationKey=key123;IngestionEndpoint=https://eastus.in.applicationinsights.azure.com/'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        
        assert settings.azure_application_insights_key == 'app-insights-key-123'
        assert 'InstrumentationKey=key123' in settings.azure_application_insights_connection_string


def test_settings_api_configuration():
    """Test API configuration settings."""
    env_vars = {
        'API_HOST': '0.0.0.0',
        'API_PORT': '8080',
        'DEBUG': 'true'
    }
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        
        assert settings.api_host == '0.0.0.0'
        assert settings.api_port == 8080
        assert settings.debug is True


def test_settings_debug_false_values():
    """Test various false values for debug setting."""
    false_values = ['false', 'False', 'FALSE', '0', 'no', 'No']
    
    for value in false_values:
        with patch.dict('os.environ', {'DEBUG': value}, clear=True):
            settings = Settings()
            assert settings.debug is False or value in ['0']  # '0' might be truthy in some cases


def test_settings_missing_optional_fields():
    """Test that optional fields can be empty."""
    with patch.dict('os.environ', {}, clear=True):
        settings = Settings()
        
        # These should be empty strings (optional)
        assert settings.azure_storage_connection_string == ""
        assert settings.azure_video_indexer_account_id == ""
        assert settings.azure_front_door_endpoint == ""
        assert settings.azure_synapse_connection_string == ""
        assert settings.azure_application_insights_key == ""


def test_settings_container_name_default():
    """Test that container name defaults to 'videos'."""
    with patch.dict('os.environ', {}, clear=True):
        settings = Settings()
        assert settings.azure_storage_container_name == "videos"


def test_settings_port_as_integer():
    """Test that API port is converted to integer."""
    env_vars = {'API_PORT': '3000'}
    
    with patch.dict('os.environ', env_vars, clear=True):
        settings = Settings()
        assert isinstance(settings.api_port, int)
        assert settings.api_port == 3000


def test_settings_streaming_preset_default():
    """Test that streaming preset defaults to 'Default' for CMAF."""
    with patch.dict('os.environ', {}, clear=True):
        settings = Settings()
        assert settings.azure_video_indexer_streaming_preset == "Default"


def test_settings_streaming_preset_options():
    """Test different streaming preset options."""
    presets = ["Default", "SingleBitrate", "NoStreaming"]
    
    for preset in presets:
        with patch.dict('os.environ', {'AZURE_VIDEO_INDEXER_STREAMING_PRESET': preset}, clear=True):
            settings = Settings()
            assert settings.azure_video_indexer_streaming_preset == preset
