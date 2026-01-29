# Testing Documentation

## Overview

This project includes a comprehensive unit testing suite with **82 tests** covering all major components of the Azure Video Streaming Platform.

## Test Coverage Summary

### Total Tests: 82 (All Passing ✅)

#### Test Files:

1. **test_api.py** (5 tests)
   - Basic API endpoint tests
   - Root endpoint validation
   - Health check endpoint
   - Video listing
   - Error handling (404)

2. **test_analytics_api.py** (19 tests)
   - Analytics endpoints (videos, insights, sync)
   - Front Door configuration
   - API structure validation
   - OpenAPI schema validation
   - HTTP method testing
   - Response format validation
   - Error handling

3. **test_blob_storage_service.py** (13 tests)
   - Service initialization
   - Video upload functionality
   - Video URL retrieval
   - Video deletion (success and failure)
   - Blob listing
   - Container initialization
   - Error handling

4. **test_video_indexer_service.py** (15 tests)
   - Service initialization
   - Access token management
   - Video upload and indexing
   - Video index retrieval
   - Insights extraction (keywords, topics, faces, etc.)
   - Indexing status checking
   - Video deletion
   - Empty data handling

5. **test_front_door_service.py** (13 tests)
   - Service initialization
   - CDN URL generation
   - Streaming URL generation
   - Configuration management
   - Cache policy validation
   - Edge cases (missing endpoint, invalid URLs)

6. **test_config.py** (14 tests)
   - Settings initialization
   - Environment variable loading
   - Default values
   - Type conversions
   - Azure service configurations
   - Case sensitivity
   - Optional field handling

7. **test_logging.py** (9 tests)
   - Logger singleton pattern
   - Logger creation
   - Operation context manager
   - Metric logging
   - Decorator functionality
   - Application Insights configuration
   - Structured formatting

8. **test_models.py** (4 tests)
   - Video model
   - VideoInsights model
   - VideoUploadResponse model
   - AnalyticsData model

## Running Tests

### Run All Tests

```bash
pytest tests/
```

### Run with Verbose Output

```bash
pytest tests/ -v
```

### Run Specific Test File

```bash
pytest tests/test_blob_storage_service.py -v
```

### Run with Coverage Report

```bash
pytest tests/ --cov=src --cov-report=html
```

### Run Specific Test

```bash
pytest tests/test_blob_storage_service.py::test_upload_video -v
```

## Test Structure

### Fixtures

Tests use pytest fixtures for setting up mock services:

```python
@pytest.fixture
def mock_blob_service():
    """Fixture for mocked BlobStorageService."""
    with patch('src.services.blob_storage.BlobServiceClient') as mock:
        service = BlobStorageService()
        yield service
```

### Async Tests

Async functions are tested using `pytest-asyncio`:

```python
@pytest.mark.asyncio
async def test_upload_video(mock_blob_service):
    """Test video upload functionality."""
    video = await mock_blob_service.upload_video(data, filename, content_type)
    assert video.name == filename
```

### Mocking

Tests use `unittest.mock` to mock Azure SDK calls:

```python
with patch('src.services.blob_storage.BlobServiceClient') as mock_client:
    service = BlobStorageService()
    # Test without making real Azure API calls
```

## Test Coverage by Component

### Services (41 tests)
- **Blob Storage**: 13 tests covering upload, download, delete, list operations
- **Video Indexer**: 15 tests covering indexing, insights, status, deletion
- **Front Door**: 13 tests covering CDN URLs, streaming, configuration

### API Layer (24 tests)
- **Video Endpoints**: 5 tests for basic video operations
- **Analytics Endpoints**: 19 tests for analytics and monitoring

### Configuration (14 tests)
- Settings validation
- Environment variable handling
- Type conversions
- Default values

### Models (4 tests)
- Data model validation
- Serialization/deserialization

### Utilities (9 tests)
- Logging functionality
- Monitoring utilities

## Test Best Practices

### 1. Independent Tests
Each test is independent and can run in any order:

```python
def test_blob_storage_initialization():
    """Test runs independently."""
    service = BlobStorageService()
    assert service.container_name == "videos"
```

### 2. Descriptive Names
Test names clearly describe what is being tested:

```python
def test_delete_video_not_found():
    """Test deleting non-existent video."""
    # Clear what scenario is tested
```

### 3. Arrange-Act-Assert
Tests follow the AAA pattern:

```python
def test_get_cdn_url_success(front_door_service):
    # Arrange
    blob_url = "https://storage.blob.core.windows.net/video.mp4"
    
    # Act
    cdn_url = front_door_service.get_cdn_url(blob_url)
    
    # Assert
    assert cdn_url == "https://cdn.azurefd.net/video.mp4"
```

### 4. Mock External Dependencies
All Azure SDK calls are mocked to avoid external dependencies:

```python
with patch('src.services.video_indexer.requests.post') as mock_post:
    mock_response = MagicMock()
    mock_response.json.return_value = {"id": "video-123"}
    mock_post.return_value = mock_response
    # Test logic
```

### 5. Test Error Cases
Tests include both success and error scenarios:

```python
def test_delete_video_success(mock_blob_service):
    """Test successful deletion."""
    result = await mock_blob_service.delete_video("123", "test.mp4")
    assert result is True

def test_delete_video_not_found(mock_blob_service):
    """Test deletion of non-existent video."""
    result = await mock_blob_service.delete_video("123", "test.mp4")
    assert result is False
```

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest tests/ -v --tb=short
```

## Coverage Goals

Current coverage:
- ✅ All services have dedicated test files
- ✅ All API endpoints are tested
- ✅ Configuration module fully tested
- ✅ Logging utilities fully tested
- ✅ Data models tested

Target coverage: **>80%** of code lines

## Adding New Tests

When adding new functionality:

1. Create corresponding test file or add to existing
2. Follow naming convention: `test_<module>_<function>.py`
3. Use fixtures for setup/teardown
4. Mock external dependencies
5. Test both success and error paths
6. Update this documentation

### Example Template

```python
"""Unit tests for new module."""
import pytest
from unittest.mock import Mock, patch
from src.services.new_module import NewService


@pytest.fixture
def mock_service():
    """Fixture for mocked service."""
    with patch('src.services.new_module.SomeClient') as mock:
        service = NewService()
        yield service


def test_new_functionality(mock_service):
    """Test new functionality."""
    # Arrange
    input_data = "test"
    
    # Act
    result = mock_service.process(input_data)
    
    # Assert
    assert result is not None
```

## Test Results

Latest test run:
```
======================= 82 passed, 11 warnings in 1.00s ========================
```

All tests passing! ✅

## Troubleshooting

### Import Errors
Make sure you're in the project root:
```bash
cd /path/to/ama_videostreaming_platform
pytest tests/
```

### Async Test Failures
Ensure pytest-asyncio is installed:
```bash
pip install pytest-asyncio
```

### Mock Issues
Check that all patches target the correct import path:
```python
# Correct: patch where it's used
with patch('src.services.blob_storage.BlobServiceClient'):
    # Not where it's defined
```

## Dependencies

Required testing packages:
- pytest==7.4.4
- pytest-asyncio==0.23.3
- pytest-cov==4.1.0

Install all dependencies:
```bash
pip install -r requirements.txt
```

## Contributing

When contributing tests:
1. Ensure all tests pass: `pytest tests/`
2. Add docstrings to test functions
3. Follow existing patterns and conventions
4. Update this documentation if needed
5. Aim for >80% code coverage

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
