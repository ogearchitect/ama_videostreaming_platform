# Azure Video Streaming Platform

A comprehensive video streaming platform built on Microsoft Azure, leveraging Azure Front Door for global content delivery, Azure Video Indexer for AI-powered video insights, and Azure Synapse Analytics for video metadata analytics.

## Architecture Overview

This platform integrates three core Azure services:

1. **Azure Front Door**: Global load balancer and CDN for fast, secure video delivery
2. **Azure Video Indexer**: AI-powered video analysis for insights extraction
3. **Azure Synapse Analytics**: Data warehouse for video metadata and analytics

## Features

- **Video Upload & Management**: Upload videos to Azure Blob Storage
- **AI-Powered Indexing**: Automatic video indexing with insights (transcription, faces, keywords, etc.)
- **Global Content Delivery**: Fast video delivery through Azure Front Door CDN
- **Analytics & Insights**: Video metadata analytics using Azure Synapse
- **RESTful API**: FastAPI-based backend for all operations
- **Scalable Architecture**: Cloud-native design for high availability
- **Comprehensive Monitoring**: Azure Application Insights integration with structured logging
- **Performance Tracking**: Automatic operation duration and metrics tracking

## Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Azure Front Door    │ (CDN + Global LB)
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│   FastAPI Backend    │
└─────┬────────────────┘
      │
      ├──────────────────────┐
      │                      │
      ▼                      ▼
┌──────────────┐    ┌────────────────────┐
│ Azure Blob   │    │ Azure Video        │
│ Storage      │◄───┤ Indexer            │
└──────────────┘    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Azure Synapse      │
                    │ Analytics          │
                    └────────────────────┘
```

## Prerequisites

- Python 3.8+
- Azure Subscription
- Azure CLI installed
- Terraform (optional, for infrastructure deployment)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=videos

# Azure Video Indexer
AZURE_VIDEO_INDEXER_ACCOUNT_ID=your_account_id
AZURE_VIDEO_INDEXER_LOCATION=your_location
AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY=your_subscription_key
AZURE_VIDEO_INDEXER_RESOURCE_ID=your_resource_id

# Azure Front Door
AZURE_FRONT_DOOR_ENDPOINT=your_frontdoor_endpoint

# Azure Synapse
AZURE_SYNAPSE_WORKSPACE_NAME=your_workspace_name
AZURE_SYNAPSE_SQL_POOL_NAME=your_sql_pool_name
AZURE_SYNAPSE_CONNECTION_STRING=your_synapse_connection_string

# Azure Application Insights (Optional - for monitoring)
AZURE_APPLICATION_INSIGHTS_KEY=your_instrumentation_key
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=your_connection_string

# Application
API_HOST=0.0.0.0
API_PORT=8000
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ogearchitect/ama_videostreaming_platform.git
cd ama_videostreaming_platform
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Azure credentials
```

## Quick Start

### 1. Deploy Azure Infrastructure

Using Terraform:
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

Or using Azure Bicep:
```bash
cd infrastructure/bicep
az deployment group create \
  --resource-group your-rg \
  --template-file main.bicep
```

### 2. Run the Application

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Video Management

- `POST /api/videos/upload` - Upload a video
- `GET /api/videos` - List all videos
- `GET /api/videos/{video_id}` - Get video details
- `DELETE /api/videos/{video_id}` - Delete a video

### Video Indexing

- `POST /api/videos/{video_id}/index` - Index a video
- `GET /api/videos/{video_id}/insights` - Get video insights
- `GET /api/videos/{video_id}/transcript` - Get video transcript

### Analytics

- `GET /api/analytics/videos` - Get video analytics
- `GET /api/analytics/insights` - Get insights analytics
- `POST /api/analytics/sync` - Sync data to Synapse

## Project Structure

```
ama_videostreaming_platform/
├── src/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Configuration management
│   ├── services/
│   │   ├── video_indexer.py      # Azure Video Indexer integration
│   │   ├── blob_storage.py       # Azure Blob Storage operations
│   │   ├── synapse_analytics.py  # Azure Synapse integration
│   │   └── front_door.py         # Azure Front Door configuration
│   ├── models/
│   │   └── video.py              # Data models
│   └── api/
│       ├── videos.py             # Video API endpoints
│       └── analytics.py          # Analytics API endpoints
├── infrastructure/
│   ├── terraform/                # Terraform IaC
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── bicep/                    # Azure Bicep IaC
│       └── main.bicep
├── tests/                        # Unit and integration tests
├── requirements.txt              # Python dependencies
├── .env.example                  # Example environment variables
├── Dockerfile                    # Docker configuration
└── README.md                     # This file
```

## Azure Services Setup

### Azure Video Indexer

1. Create a Video Indexer account in Azure Portal
2. Note the Account ID and Location
3. Create a managed identity or use API key authentication

### Azure Front Door

1. Create an Azure Front Door profile
2. Configure origin (your API backend)
3. Set up routing rules and caching policies
4. Configure WAF policies for security

### Azure Synapse Analytics

1. Create a Synapse workspace
2. Create a dedicated SQL pool
3. Set up linked services to connect to storage
4. Create tables for video metadata

## Development

### Running Tests

```bash
pytest tests/ -v --cov=src
```

### Code Formatting

```bash
black src/
flake8 src/
```

## Deployment

### Docker Deployment

```bash
docker build -t video-streaming-platform .
docker run -p 8000:8000 --env-file .env video-streaming-platform
```

### Azure App Service Deployment

```bash
az webapp up --name your-app-name --resource-group your-rg
```

## Security Considerations

- All Azure credentials are managed via environment variables
- Azure Managed Identity is recommended for production
- Front Door includes WAF for DDoS protection
- Video files are stored in private blob containers
- API authentication should be implemented for production use

## Performance Optimization

- Azure Front Door caching reduces latency globally
- Video Indexer processes videos asynchronously
- Synapse Analytics enables fast querying of large datasets
- Blob Storage uses hot tier for frequently accessed videos

## Monitoring & Logging

The platform includes comprehensive monitoring and logging for all Azure components:

- **Structured Logging**: All operations logged with context (service, operation, duration, status)
- **Application Insights**: Real-time monitoring, log analytics, and custom dashboards
- **Request Tracing**: Every HTTP request tracked with duration and correlation IDs
- **Performance Metrics**: Automatic tracking of operation durations and custom metrics
- **Error Tracking**: Detailed error logging with stack traces and context
- **Service Health**: Monitor Blob Storage, Video Indexer, Synapse, and Front Door

See [MONITORING.md](MONITORING.md) for detailed monitoring and logging configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For issues and questions, please create an issue in the GitHub repository.

## Acknowledgments

Built with Azure services:
- Azure Front Door
- Azure Video Indexer
- Azure Synapse Analytics
- Azure Blob Storage