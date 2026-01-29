# Azure Monitoring & Logging - Implementation Summary

## Overview

This document summarizes the comprehensive monitoring and logging implementation for the Azure Video Streaming Platform.

## What Was Added

### 1. Core Logging Infrastructure

**File**: `src/utils/logging.py`

A centralized logging system with:
- **AzureLogger**: Singleton class managing all logging operations
- **StructuredFormatter**: Consistent log format across all services
- **Application Insights Integration**: Optional Azure Monitor integration
- **Operation Tracking**: Automatic duration and status tracking
- **Metric Logging**: Custom metrics for business intelligence

### 2. Service Instrumentation

All Azure services now include comprehensive logging:

#### Blob Storage (`src/services/blob_storage.py`)
- Service initialization
- Video upload operations (with file size metrics)
- Video deletion operations
- Blob listing operations
- Error handling and logging

#### Video Indexer (`src/services/video_indexer.py`)
- Service initialization
- Access token acquisition
- Video upload and indexing
- Insights extraction (with keyword/topic/face metrics)
- Status checking
- Video deletion

#### Synapse Analytics (`src/services/synapse_analytics.py`)
- Service initialization
- Database connection establishment
- Table operations
- Video data insertion/updates
- Insights data insertion
- Analytics queries
- Delete operations

#### Front Door (`src/services/front_door.py`)
- Service initialization
- CDN URL generation
- Streaming URL generation
- Configuration status

### 3. Application-Level Logging

**File**: `src/main.py`

- HTTP request/response logging middleware
- Request duration tracking
- Request ID correlation (X-Request-ID header)
- Error logging with full stack traces
- Startup/shutdown event logging
- Application Insights configuration

### 4. Configuration

**File**: `src/config.py`

Added settings:
- `azure_application_insights_key`
- `azure_application_insights_connection_string`

### 5. Testing

**File**: `tests/test_logging.py`

9 comprehensive tests covering:
- Singleton pattern
- Logger creation
- Context manager (success and error cases)
- Metric logging
- Decorator functionality (sync and async)
- Application Insights configuration
- Structured formatting

### 6. Documentation

**Files**:
- `MONITORING.md`: Complete monitoring guide (queries, alerts, best practices)
- `README.md`: Updated with monitoring features
- `.env.example`: Application Insights configuration examples

## Log Format

### Console Output

```
YYYY-MM-DD HH:MM:SS - logger_name - LEVEL - [service] [operation] message - duration=Xms status=Y
```

**Example**:
```
2026-01-29 14:57:46 - src.services.blob_storage - INFO - [blob_storage] [upload] Video uploaded successfully: test.mp4 - duration=234ms status=success
```

### Structured Fields

Every log entry includes:
- **service**: Azure service name (blob_storage, video_indexer, etc.)
- **operation**: Operation name (upload, index, query, etc.)
- **duration_ms**: Operation duration in milliseconds
- **status**: Operation status (success, error, warning, etc.)
- **Additional context**: video_id, file_size, error details, etc.

## Key Features

### 1. Structured Logging ✅
Consistent format across all services with rich contextual information.

### 2. Application Insights Integration ✅
Optional integration for production monitoring:
- Real-time telemetry
- Log analytics and queries
- Custom dashboards
- Alerts and notifications

### 3. Performance Tracking ✅
Automatic measurement of:
- HTTP request duration
- Azure operation duration
- Database query duration
- File upload/download duration

### 4. Request Correlation ✅
- X-Request-ID header for tracing requests
- Consistent request ID across all logs
- End-to-end request tracking

### 5. Error Tracking ✅
Comprehensive error logging:
- Exception type and message
- Full stack traces
- Operation context
- Error categorization

### 6. Custom Metrics ✅
Business metrics:
- Video upload sizes
- Number of keywords extracted
- Number of topics identified
- Number of faces detected
- Database query counts

### 7. Backward Compatibility ✅
- Works with or without Application Insights
- Graceful degradation if monitoring is not configured
- No breaking changes to existing functionality

## Usage Examples

### Decorator Pattern

```python
from src.utils.logging import log_azure_operation

@log_azure_operation('my_service', 'my_operation')
async def my_function():
    # Your code here
    pass
```

### Context Manager

```python
from src.utils.logging import azure_logger

logger = azure_logger.get_logger(__name__, 'my_service')

with azure_logger.log_operation(logger, 'my_operation', 'my_service'):
    # Your code here
    pass
```

### Custom Metrics

```python
azure_logger.log_metric(
    logger,
    'metric_name',
    value,
    'service_name',
    tag1='value1'
)
```

## Application Insights Queries

### Request Performance
```kusto
traces
| where customDimensions.service == "api"
| summarize avg(toint(customDimensions.duration_ms)) by tostring(customDimensions.path)
```

### Error Rate
```kusto
traces
| where customDimensions.status == "error"
| summarize count() by bin(timestamp, 5m), tostring(customDimensions.service)
```

### Service Health
```kusto
traces
| where customDimensions.operation == "initialize"
| project timestamp, service=customDimensions.service, status=customDimensions.status
```

## Testing Results

All tests passing: **18/18** ✅

- Original tests: 9/9 ✅
- New logging tests: 9/9 ✅

Test coverage includes:
- Singleton pattern verification
- Logger instance creation
- Operation tracking (success and error)
- Metric logging
- Decorator functionality
- Application Insights configuration
- Structured formatting

## Dependencies Added

```
azure-monitor-opentelemetry==1.2.0
opencensus-ext-azure==1.1.13
opentelemetry-api==1.22.0
opentelemetry-sdk==1.22.0
opentelemetry-instrumentation-fastapi==0.43b0
```

## Configuration Steps

1. **Create Application Insights** (optional):
   ```bash
   az monitor app-insights component create \
     --app video-streaming-insights \
     --location eastus \
     --resource-group your-rg
   ```

2. **Get Instrumentation Key**:
   ```bash
   az monitor app-insights component show \
     --app video-streaming-insights \
     --resource-group your-rg \
     --query instrumentationKey
   ```

3. **Configure Environment**:
   ```env
   AZURE_APPLICATION_INSIGHTS_KEY=your-key
   AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;...
   ```

4. **Run Application**:
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000
   ```

## Benefits

1. **Troubleshooting**: Quickly identify and diagnose issues
2. **Performance**: Monitor operation duration and optimize slow operations
3. **Reliability**: Track error rates and service health
4. **Compliance**: Audit trail of all operations
5. **Business Intelligence**: Metrics for business decisions
6. **Operational Visibility**: Real-time insight into system behavior

## Next Steps

1. Configure Application Insights in production
2. Set up custom dashboards in Azure Portal
3. Configure alerts for high error rates or slow operations
4. Review logs regularly to identify optimization opportunities
5. Add additional custom metrics as needed

## Support

For detailed information:
- See `MONITORING.md` for comprehensive monitoring guide
- See `README.md` for setup instructions
- Check test files for usage examples

---

**Status**: Complete and Production-Ready ✅  
**Test Coverage**: 18/18 tests passing ✅  
**Security**: No vulnerabilities detected ✅  
**Documentation**: Complete ✅
