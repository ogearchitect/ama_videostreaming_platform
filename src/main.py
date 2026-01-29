"""Main FastAPI application for Azure Video Streaming Platform.

Security Considerations:
------------------------
1. API authentication should be implemented for production use
2. CORS configuration should be restricted to trusted origins
3. Rate limiting should be implemented to prevent abuse
4. Input validation is enforced via Pydantic models
5. Request logging for security auditing and monitoring

Production Security Requirements:
----------------------------------
1. Authentication & Authorization:
   - Implement OAuth2 with JWT tokens
   - Use Azure AD for user authentication
   - Add API key authentication for service-to-service calls
   - Example: from fastapi.security import OAuth2PasswordBearer

2. CORS Configuration:
   - Replace allow_origins=["*"] with specific allowed origins
   - Use environment variable for allowed origins
   - Example: allow_origins=["https://yourdomain.com"]

3. Rate Limiting:
   - Implement rate limiting per IP/user
   - Protect against brute force and DoS attacks
   - Example: from slowapi import Limiter

4. Input Validation:
   - All inputs validated via Pydantic models (already implemented)
   - Additional sanitization for file uploads
   - Validate file types, sizes, and content

5. HTTPS Only:
   - Configure Front Door for HTTPS only
   - Redirect HTTP to HTTPS
   - Use HSTS headers

6. Security Headers:
   - Add security headers middleware
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Content-Security-Policy

Example Production Authentication:
-----------------------------------
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/api/videos")
async def get_videos(token: str = Depends(oauth2_scheme)):
    # Verify token and get user
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return videos
    except JWTError:
        raise credentials_exception
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from src.api import videos, analytics
from src.config import settings
from src.utils.logging import azure_logger


# Initialize logging
logger = azure_logger.get_logger(__name__, 'application')

# Configure Application Insights if key is provided
if settings.azure_application_insights_key:
    azure_logger.configure_application_insights(settings.azure_application_insights_key)
    logger.info("Application Insights configured", extra={
        'service': 'application',
        'operation': 'startup',
        'duration_ms': 0,
        'status': 'success'
    })
else:
    logger.warning("Application Insights key not configured - using console logging only", extra={
        'service': 'application',
        'operation': 'startup',
        'duration_ms': 0,
        'status': 'warning'
    })


# Create FastAPI app
app = FastAPI(
    title="Azure Video Streaming Platform",
    description="A video streaming platform using Azure Front Door, Video Indexer, and Synapse Analytics",
    version="1.0.0"
)


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all HTTP requests with duration tracking."""
    start_time = time.time()
    request_id = request.headers.get('X-Request-ID', 'no-request-id')
    
    # Log request start
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            'service': 'api',
            'operation': 'http_request',
            'method': request.method,
            'path': request.url.path,
            'request_id': request_id,
            'duration_ms': 0,
            'status': 'started'
        }
    )
    
    try:
        response = await call_next(request)
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log successful request
        logger.info(
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            extra={
                'service': 'api',
                'operation': 'http_request',
                'method': request.method,
                'path': request.url.path,
                'status_code': response.status_code,
                'request_id': request_id,
                'duration_ms': duration_ms,
                'status': 'success' if response.status_code < 400 else 'error'
            }
        )
        
        # Add request ID to response headers
        response.headers['X-Request-ID'] = request_id
        return response
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log failed request
        logger.error(
            f"Request failed: {request.method} {request.url.path} - {str(e)}",
            extra={
                'service': 'api',
                'operation': 'http_request',
                'method': request.method,
                'path': request.url.path,
                'request_id': request_id,
                'duration_ms': duration_ms,
                'status': 'error',
                'error': str(e),
                'error_type': type(e).__name__
            },
            exc_info=True
        )
        
        # Return error response
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={'X-Request-ID': request_id}
        )


# Configure CORS
# Security: In production, replace allow_origins=["*"] with specific allowed origins
# Example: allow_origins=["https://yourdomain.com", "https://app.yourdomain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure appropriately for production (security requirement)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos.router)
app.include_router(analytics.router)


@app.on_event("startup")
async def startup_event():
    """Application startup event handler."""
    logger.info("Application starting up", extra={
        'service': 'application',
        'operation': 'startup',
        'duration_ms': 0,
        'status': 'success'
    })


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event handler."""
    logger.info("Application shutting down", extra={
        'service': 'application',
        'operation': 'shutdown',
        'duration_ms': 0,
        'status': 'success'
    })


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
