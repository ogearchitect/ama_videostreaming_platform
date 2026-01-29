"""Video API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from datetime import datetime
from src.models.video import (
    Video, VideoUploadResponse, VideoListResponse, 
    VideoInsights, VideoStatus
)
from src.services.blob_storage import blob_storage_service
from src.services.video_indexer import video_indexer_service
from src.services.synapse_analytics import synapse_analytics_service
from src.services.front_door import front_door_service


router = APIRouter(prefix="/api/videos", tags=["videos"])


# In-memory storage for demo (replace with actual database in production)
videos_db: dict = {}
indexer_mapping: dict = {}  # Maps video_id to indexer_video_id


async def index_video_background(video_id: str, blob_url: str, video_name: str):
    """Background task to index a video."""
    try:
        # Upload to Video Indexer
        indexer_video_id = await video_indexer_service.upload_video(
            blob_url, video_name, video_id
        )
        
        # Store the mapping
        indexer_mapping[video_id] = indexer_video_id
        
        # Update video status
        if video_id in videos_db:
            videos_db[video_id].status = VideoStatus.INDEXING
        
        # Update in Synapse
        await synapse_analytics_service.update_video_status(
            video_id, VideoStatus.INDEXING.value
        )
        
    except Exception as e:
        # Update status to failed
        if video_id in videos_db:
            videos_db[video_id].status = VideoStatus.FAILED
        await synapse_analytics_service.update_video_status(
            video_id, VideoStatus.FAILED.value
        )


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload a video file.
    
    Args:
        file: Video file to upload
        
    Returns:
        Upload response with video details
    """
    try:
        # Read file data
        file_data = await file.read()
        
        # Upload to blob storage
        video = await blob_storage_service.upload_video(
            file_data,
            file.filename,
            file.content_type or "video/mp4"
        )
        
        # Store in local database
        videos_db[video.id] = video
        
        # Store in Synapse
        await synapse_analytics_service.insert_video(video)
        
        # Get CDN URL
        cdn_url = front_door_service.get_cdn_url(video.blob_url)
        
        return VideoUploadResponse(
            video_id=video.id,
            blob_url=cdn_url,
            message="Video uploaded successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("", response_model=VideoListResponse)
async def list_videos():
    """
    List all videos.
    
    Returns:
        List of videos
    """
    videos = list(videos_db.values())
    return VideoListResponse(
        videos=videos,
        total=len(videos)
    )


@router.get("/{video_id}", response_model=Video)
async def get_video(video_id: str):
    """
    Get video details.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Video details
    """
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return videos_db[video_id]


@router.post("/{video_id}/index")
async def index_video(video_id: str, background_tasks: BackgroundTasks):
    """
    Start indexing a video.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Indexing status
    """
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = videos_db[video_id]
    
    # Start indexing in background
    background_tasks.add_task(
        index_video_background,
        video_id,
        video.blob_url,
        video.name
    )
    
    return {
        "message": "Indexing started",
        "video_id": video_id,
        "status": "indexing"
    }


@router.get("/{video_id}/insights", response_model=VideoInsights)
async def get_video_insights(video_id: str):
    """
    Get video insights from Video Indexer.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Video insights
    """
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video_id not in indexer_mapping:
        raise HTTPException(
            status_code=400,
            detail="Video has not been indexed yet. Call /index first."
        )
    
    indexer_video_id = indexer_mapping[video_id]
    
    try:
        # Get insights from Video Indexer
        insights = await video_indexer_service.get_video_insights(
            indexer_video_id,
            video_id
        )
        
        # Store insights in Synapse
        await synapse_analytics_service.insert_insights(insights)
        
        # Update video status
        videos_db[video_id].status = VideoStatus.INDEXED
        videos_db[video_id].indexed_at = datetime.utcnow()
        
        await synapse_analytics_service.update_video_status(
            video_id,
            VideoStatus.INDEXED.value,
            datetime.utcnow()
        )
        
        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")


@router.get("/{video_id}/transcript")
async def get_video_transcript(video_id: str):
    """
    Get video transcript.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Video transcript
    """
    if video_id not in indexer_mapping:
        raise HTTPException(
            status_code=400,
            detail="Video has not been indexed yet"
        )
    
    indexer_video_id = indexer_mapping[video_id]
    
    try:
        insights = await video_indexer_service.get_video_insights(
            indexer_video_id,
            video_id
        )
        
        return {
            "video_id": video_id,
            "transcript": insights.transcript,
            "language": insights.language
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transcript: {str(e)}")


@router.delete("/{video_id}")
async def delete_video(video_id: str):
    """
    Delete a video.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Deletion status
    """
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = videos_db[video_id]
    
    try:
        # Delete from blob storage
        await blob_storage_service.delete_video(video_id, video.name)
        
        # Delete from Video Indexer if indexed
        if video_id in indexer_mapping:
            indexer_video_id = indexer_mapping[video_id]
            await video_indexer_service.delete_video(indexer_video_id)
            del indexer_mapping[video_id]
        
        # Delete from Synapse
        await synapse_analytics_service.delete_video(video_id)
        
        # Delete from local database
        del videos_db[video_id]
        
        return {
            "message": "Video deleted successfully",
            "video_id": video_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete video: {str(e)}")


@router.get("/{video_id}/streaming-url")
async def get_streaming_url(video_id: str):
    """
    Get the streaming URL for a video via Front Door.
    
    Args:
        video_id: Video identifier
        
    Returns:
        Streaming URL
    """
    if video_id not in videos_db:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = videos_db[video_id]
    
    try:
        streaming_url = front_door_service.get_streaming_url(video_id, video.name)
        cdn_url = front_door_service.get_cdn_url(video.blob_url)
        
        return {
            "video_id": video_id,
            "streaming_url": streaming_url,
            "cdn_url": cdn_url
        }
        
    except Exception as e:
        return {
            "video_id": video_id,
            "blob_url": video.blob_url,
            "message": "Front Door not configured, using blob URL"
        }
