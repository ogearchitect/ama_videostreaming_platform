"""Main FastAPI application for Azure Video Streaming Platform."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import videos, analytics
from src.config import settings


# Create FastAPI app
app = FastAPI(
    title="Azure Video Streaming Platform",
    description="A video streaming platform using Azure Front Door, Video Indexer, and Synapse Analytics",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Azure Video Streaming Platform",
        "version": "1.0.0",
        "description": "Video streaming platform with Azure services",
        "services": {
            "azure_front_door": {
                "enabled": bool(settings.azure_front_door_endpoint),
                "description": "Global CDN and load balancing"
            },
            "azure_video_indexer": {
                "enabled": bool(settings.azure_video_indexer_account_id),
                "description": "AI-powered video analysis"
            },
            "azure_synapse": {
                "enabled": bool(settings.azure_synapse_connection_string),
                "description": "Data warehouse for analytics"
            },
            "azure_blob_storage": {
                "enabled": bool(settings.azure_storage_connection_string),
                "description": "Video file storage"
            }
        },
        "endpoints": {
            "docs": "/docs",
            "videos": "/api/videos",
            "analytics": "/api/analytics"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "blob_storage": bool(settings.azure_storage_connection_string),
            "video_indexer": bool(settings.azure_video_indexer_account_id),
            "front_door": bool(settings.azure_front_door_endpoint),
            "synapse": bool(settings.azure_synapse_connection_string)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
