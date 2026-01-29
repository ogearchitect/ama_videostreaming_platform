# Azure Monitoring and Logging Guide

This guide explains how to configure and use Azure monitoring and logging for the Video Streaming Platform.

## Overview

The platform includes comprehensive monitoring and logging for all Azure components:

- **Azure Blob Storage**: Video upload, download, and deletion operations
- **Azure Video Indexer**: Video indexing and insights extraction
- **Azure Synapse Analytics**: Database operations and queries
- **Azure Front Door**: CDN URL generation and streaming
- **FastAPI Application**: HTTP requests, errors, and performance

## Features

### Structured Logging
All logs include contextual information:
- Service name (blob_storage, video_indexer, etc.)
- Operation name (upload, index, query, etc.)
- Duration in milliseconds
- Status (success, error, warning)
- Additional context (video_id, file_size, etc.)

### Application Insights Integration
When configured, logs are automatically sent to Azure Application Insights for:
- Real-time monitoring
- Log analytics and queries
- Custom dashboards
- Alerts and notifications
- Performance tracking

### Request Tracing
Every HTTP request is logged with:
- Method and path
- Status code
- Duration
- Request ID (for correlation)
- Error details (if applicable)

### Metrics
Custom metrics are logged for:
- Video upload sizes
- Number of keywords/topics extracted
- Number of faces detected
- Database query counts

## Configuration

### 1. Application Insights Setup

Create an Application Insights resource in Azure Portal:

```bash
az monitor app-insights component create \
  --app video-streaming-insights \
  --location eastus \
  --resource-group your-resource-group
```

Get the instrumentation key:

```bash
az monitor app-insights component show \
  --app video-streaming-insights \
  --resource-group your-resource-group \
  --query instrumentationKey
```

### 2. Environment Configuration

Add to your `.env` file:

```env
# Azure Application Insights
AZURE_APPLICATION_INSIGHTS_KEY=your-instrumentation-key
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://eastus.in.applicationinsights.azure.com/
```

### 3. Verify Configuration

Start the application and check logs:

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

You should see:
```
2026-01-29 14:50:53 - src.main - INFO - [application] [startup] Application Insights configured - duration=0ms status=success
```

Without Application Insights configured:
```
2026-01-29 14:50:53 - src.main - WARNING - [application] [startup] Application Insights key not configured - using console logging only - duration=0ms status=warning
```

## Log Format

### Console Logs

```
YYYY-MM-DD HH:MM:SS - logger_name - LEVEL - [service] [operation] message - duration=Xms status=Y
```

Example:
```
2026-01-29 14:50:53 - src.services.blob_storage - INFO - [blob_storage] [upload] Video uploaded successfully: test.mp4 - duration=234ms status=success
```

### Application Insights

Logs sent to Application Insights include additional properties:
- `customDimensions.service`: Service name
- `customDimensions.operation`: Operation name
- `customDimensions.duration_ms`: Operation duration
- `customDimensions.status`: Operation status
- Additional context fields (video_id, error_type, etc.)

## Usage Examples

### Viewing Logs

#### Console Output
Logs are automatically printed to stdout with structured formatting.

#### Application Insights
Query logs in Azure Portal:

```kusto
traces
| where customDimensions.service == "blob_storage"
| where customDimensions.operation == "upload"
| project timestamp, message, customDimensions
| order by timestamp desc
```

### Monitoring Specific Services

#### Blob Storage Operations
```kusto
traces
| where customDimensions.service == "blob_storage"
| summarize count() by tostring(customDimensions.operation)
```

#### Video Indexer Performance
```kusto
traces
| where customDimensions.service == "video_indexer"
| where customDimensions.status == "success"
| summarize avg(toint(customDimensions.duration_ms)) by tostring(customDimensions.operation)
```

#### API Request Performance
```kusto
traces
| where customDimensions.service == "api"
| where customDimensions.operation == "http_request"
| summarize 
    avg_duration=avg(toint(customDimensions.duration_ms)),
    p95_duration=percentile(toint(customDimensions.duration_ms), 95),
    count=count()
    by tostring(customDimensions.path)
```

#### Error Tracking
```kusto
traces
| where customDimensions.status == "error"
| project timestamp, message, service=customDimensions.service, 
    operation=customDimensions.operation, error=customDimensions.error
| order by timestamp desc
```

### Setting Up Alerts

Create alerts in Application Insights for:

#### High Error Rate
```kusto
traces
| where customDimensions.status == "error"
| summarize error_count=count() by bin(timestamp, 5m)
| where error_count > 10
```

#### Slow Operations
```kusto
traces
| where toint(customDimensions.duration_ms) > 5000
| project timestamp, service=customDimensions.service, 
    operation=customDimensions.operation, 
    duration_ms=customDimensions.duration_ms
```

## Custom Logging in Code

### Using the Decorator

```python
from src.utils.logging import log_azure_operation

@log_azure_operation('my_service', 'my_operation')
async def my_function():
    # Your code here
    pass
```

### Using Context Manager

```python
from src.utils.logging import azure_logger

logger = azure_logger.get_logger(__name__, 'my_service')

async def my_function():
    with azure_logger.log_operation(logger, 'my_operation', 'my_service', custom_field='value'):
        # Your code here
        pass
```

### Logging Metrics

```python
from src.utils.logging import azure_logger

logger = azure_logger.get_logger(__name__, 'my_service')

azure_logger.log_metric(
    logger,
    'custom_metric_name',
    42.0,
    'my_service',
    tag1='value1',
    tag2='value2'
)
```

## Best Practices

### 1. Always Include Context
Include relevant context in log messages (IDs, names, sizes, etc.)

### 2. Use Appropriate Log Levels
- **INFO**: Normal operations
- **WARNING**: Non-critical issues (missing config, fallbacks)
- **ERROR**: Failures that affect functionality
- **DEBUG**: Detailed diagnostic information

### 3. Log Operation Duration
Use the `log_operation` context manager to automatically track duration

### 4. Include Error Details
When logging errors, include:
- Error message
- Error type
- Relevant context (what was being processed)

### 5. Avoid Logging Sensitive Data
Never log:
- Passwords or keys
- Personal information
- Full connection strings
- Access tokens

## Troubleshooting

### Logs Not Appearing in Application Insights

1. Check instrumentation key is correct
2. Verify network connectivity to Azure
3. Check for firewall rules blocking traffic
4. Wait a few minutes for data to appear (there's a delay)

### Console Logging Issues

1. Check log level configuration
2. Verify logger initialization
3. Check for redirected output

### Missing Context Fields

1. Ensure using structured logging utilities
2. Check logger is created with service name
3. Verify custom fields are passed correctly

## Monitoring Dashboard

Create a custom dashboard in Azure Portal with:

1. **Request Volume**: Total API requests over time
2. **Error Rate**: Percentage of failed operations
3. **Performance**: Average response time by endpoint
4. **Service Health**: Success rate per Azure service
5. **Top Errors**: Most common error types

Example query for dashboard:
```kusto
traces
| where customDimensions.service == "api"
| summarize 
    total_requests=count(),
    errors=countif(customDimensions.status == "error"),
    avg_duration_ms=avg(toint(customDimensions.duration_ms))
    by bin(timestamp, 1h)
| extend error_rate = (errors * 100.0) / total_requests
```

## Support

For issues with monitoring and logging:
1. Check Application Insights configuration
2. Review console output for errors
3. Verify all dependencies are installed
4. Check Azure service health status
