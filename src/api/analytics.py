"""Analytics API endpoints."""
from fastapi import APIRouter, HTTPException
from src.models.video import AnalyticsData
from src.services.synapse_analytics import synapse_analytics_service
from src.services.front_door import front_door_service


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/videos", response_model=AnalyticsData)
async def get_video_analytics():
    """
    Get video analytics from Synapse.
    
    Returns:
        Analytics data with aggregated statistics
    """
    try:
        analytics = await synapse_analytics_service.get_analytics()
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/insights")
async def get_insights_summary():
    """
    Get a summary of video insights.
    
    Returns:
        Insights summary
    """
    try:
        analytics = await synapse_analytics_service.get_analytics()
        
        return {
            "summary": {
                "total_videos": analytics.total_videos,
                "indexed_videos": analytics.indexed_videos,
                "failed_videos": analytics.failed_videos,
                "total_duration_hours": round(analytics.total_duration / 3600, 2),
                "indexing_success_rate": (
                    round(analytics.indexed_videos / analytics.total_videos * 100, 2)
                    if analytics.total_videos > 0 else 0
                )
            },
            "top_keywords": analytics.top_keywords[:5],
            "top_topics": analytics.top_topics[:5]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get insights summary: {str(e)}"
        )


@router.post("/sync")
async def sync_to_synapse():
    """
    Trigger a sync of data to Synapse Analytics.
    
    Returns:
        Sync status
    """
    try:
        # Initialize tables if they don't exist
        await synapse_analytics_service.initialize_tables()
        
        return {
            "message": "Synapse tables initialized successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync to Synapse: {str(e)}"
        )


@router.get("/front-door")
async def get_front_door_config():
    """
    Get Front Door configuration and status.
    
    Returns:
        Front Door configuration
    """
    try:
        config = front_door_service.get_configuration()
        cache_policy = front_door_service.get_cache_policy()
        
        return {
            "configuration": config,
            "cache_policy": cache_policy
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Front Door config: {str(e)}"
        )
