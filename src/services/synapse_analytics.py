"""Azure Synapse Analytics service for video metadata and analytics.

Security Considerations:
------------------------
1. Connection string authentication (development) or Managed Identity (production)
2. SQL injection prevention via parameterized queries
3. Encrypted connections (Encrypt=yes in connection string)
4. Firewall rules to restrict database access
5. Row-level security and column-level security for data access control
6. Audit logging for compliance and security monitoring

Production Authentication:
---------------------------
Use Azure Managed Identity instead of connection strings:
    from azure.identity import DefaultAzureCredential
    import pyodbc
    
    credential = DefaultAzureCredential()
    token = credential.get_token("https://database.windows.net/.default")
    connection_string = "Driver={ODBC Driver 17 for SQL Server};Server=..."
    connection = pyodbc.connect(connection_string, attrs_before={
        1256: token.token  # SQL_COPT_SS_ACCESS_TOKEN
    })

Security Best Practices:
------------------------
1. Always use parameterized queries (never string concatenation)
2. Enable TDE (Transparent Data Encryption) for data at rest
3. Configure firewall to allow only trusted IP addresses
4. Use Azure AD authentication instead of SQL authentication
5. Enable Advanced Threat Protection for security alerts
6. Implement row-level security for multi-tenant scenarios
7. Regular security audits and compliance reviews
"""
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.config import settings
from src.models.video import Video, VideoInsights, AnalyticsData
from src.utils.logging import azure_logger, log_azure_operation


# Initialize logger for this service
logger = azure_logger.get_logger(__name__, 'synapse_analytics')


class SynapseAnalyticsService:
    """Service for Azure Synapse Analytics integration.
    
    Security Features:
    - Encrypted connections (TLS/SSL)
    - Parameterized queries to prevent SQL injection
    - Support for Managed Identity authentication
    - Firewall-protected database access
    - Audit logging capabilities
    """
    
    def __init__(self):
        """Initialize the Synapse Analytics service."""
        self.connection_string = settings.azure_synapse_connection_string
        self.workspace_name = settings.azure_synapse_workspace_name
        self.sql_pool_name = settings.azure_synapse_sql_pool_name
        self.connection = None
        
        logger.info("Synapse Analytics service initialized", extra={
            'service': 'synapse_analytics',
            'operation': 'initialize',
            'workspace_name': self.workspace_name,
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('synapse_analytics', 'get_connection')
    def get_connection(self):
        """Get a database connection."""
        if not PYODBC_AVAILABLE:
            raise ImportError("pyodbc is not installed. Install it to use Synapse Analytics.")
        
        if not self.connection_string:
            raise ValueError("Synapse connection string not configured")
        
        if not self.connection or self.connection.closed:
            self.connection = pyodbc.connect(self.connection_string)
            logger.info("Database connection established", extra={
                'service': 'synapse_analytics',
                'operation': 'connect',
                'duration_ms': 0,
                'status': 'success'
            })
        
        return self.connection
    
    @log_azure_operation('synapse_analytics', 'initialize_tables')
    async def initialize_tables(self):
        """Create necessary tables if they don't exist."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create videos table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'videos')
            CREATE TABLE videos (
                video_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(500),
                blob_url VARCHAR(1000),
                status VARCHAR(50),
                uploaded_at DATETIME,
                indexed_at DATETIME,
                duration FLOAT,
                size_bytes BIGINT,
                content_type VARCHAR(100)
            )
        """)
        
        # Create insights table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'video_insights')
            CREATE TABLE video_insights (
                id INT IDENTITY(1,1) PRIMARY KEY,
                video_id VARCHAR(255),
                transcript TEXT,
                language VARCHAR(50),
                created_at DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (video_id) REFERENCES videos(video_id)
            )
        """)
        
        # Create keywords table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'video_keywords')
            CREATE TABLE video_keywords (
                id INT IDENTITY(1,1) PRIMARY KEY,
                video_id VARCHAR(255),
                keyword VARCHAR(500),
                FOREIGN KEY (video_id) REFERENCES videos(video_id)
            )
        """)
        
        # Create topics table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'video_topics')
            CREATE TABLE video_topics (
                id INT IDENTITY(1,1) PRIMARY KEY,
                video_id VARCHAR(255),
                topic VARCHAR(500),
                FOREIGN KEY (video_id) REFERENCES videos(video_id)
            )
        """)
        
        conn.commit()
        cursor.close()
        
        logger.info("Database tables initialized", extra={
            'service': 'synapse_analytics',
            'operation': 'initialize_tables',
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('synapse_analytics', 'insert_video')
    async def insert_video(self, video: Video):
        """
        Insert video metadata into Synapse.
        
        Args:
            video: Video model to insert
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO videos (video_id, name, blob_url, status, uploaded_at, indexed_at, duration, size_bytes, content_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            video.id,
            video.name,
            video.blob_url,
            video.status.value,
            video.uploaded_at,
            video.indexed_at,
            video.duration,
            video.size_bytes,
            video.content_type
        ))
        
        conn.commit()
        cursor.close()
        
        logger.info(f"Video inserted to Synapse: {video.name}", extra={
            'service': 'synapse_analytics',
            'operation': 'insert_video',
            'video_id': video.id,
            'video_name': video.name,
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('synapse_analytics', 'update_video_status')
    async def update_video_status(self, video_id: str, status: str, indexed_at: Optional[datetime] = None):
        """
        Update video status in Synapse.
        
        Args:
            video_id: Video identifier
            status: New status
            indexed_at: Indexing completion time
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE videos
            SET status = ?, indexed_at = ?
            WHERE video_id = ?
        """, (status, indexed_at, video_id))
        
        conn.commit()
        cursor.close()
        
        logger.info(f"Video status updated: {status}", extra={
            'service': 'synapse_analytics',
            'operation': 'update_status',
            'video_id': video_id,
            'status_value': status,
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('synapse_analytics', 'insert_insights')
    async def insert_insights(self, insights: VideoInsights):
        """
        Insert video insights into Synapse.
        
        Args:
            insights: VideoInsights model
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Insert main insights
        cursor.execute("""
            INSERT INTO video_insights (video_id, transcript, language)
            VALUES (?, ?, ?)
        """, (insights.video_id, insights.transcript, insights.language))
        
        # Insert keywords
        for keyword in insights.keywords:
            cursor.execute("""
                INSERT INTO video_keywords (video_id, keyword)
                VALUES (?, ?)
            """, (insights.video_id, keyword))
        
        # Insert topics
        for topic in insights.topics:
            cursor.execute("""
                INSERT INTO video_topics (video_id, topic)
                VALUES (?, ?)
            """, (insights.video_id, topic))
        
        conn.commit()
        cursor.close()
        
        logger.info(f"Video insights inserted", extra={
            'service': 'synapse_analytics',
            'operation': 'insert_insights',
            'video_id': insights.video_id,
            'keywords_count': len(insights.keywords),
            'topics_count': len(insights.topics),
            'duration_ms': 0,
            'status': 'success'
        })
    
    @log_azure_operation('synapse_analytics', 'get_analytics')
    async def get_analytics(self) -> AnalyticsData:
        """
        Get analytics data from Synapse.
        
        Returns:
            AnalyticsData model with aggregated statistics
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get total videos
        cursor.execute("SELECT COUNT(*) FROM videos")
        total_videos = cursor.fetchone()[0]
        
        # Get total duration
        cursor.execute("SELECT SUM(duration) FROM videos WHERE duration IS NOT NULL")
        result = cursor.fetchone()
        total_duration = result[0] if result[0] else 0.0
        
        # Get indexed videos count
        cursor.execute("SELECT COUNT(*) FROM videos WHERE status = 'indexed'")
        indexed_videos = cursor.fetchone()[0]
        
        # Get failed videos count
        cursor.execute("SELECT COUNT(*) FROM videos WHERE status = 'failed'")
        failed_videos = cursor.fetchone()[0]
        
        # Get top keywords
        cursor.execute("""
            SELECT TOP 10 keyword, COUNT(*) as count
            FROM video_keywords
            GROUP BY keyword
            ORDER BY count DESC
        """)
        top_keywords = [{'keyword': row[0], 'count': row[1]} for row in cursor.fetchall()]
        
        # Get top topics
        cursor.execute("""
            SELECT TOP 10 topic, COUNT(*) as count
            FROM video_topics
            GROUP BY topic
            ORDER BY count DESC
        """)
        top_topics = [{'topic': row[0], 'count': row[1]} for row in cursor.fetchall()]
        
        cursor.close()
        
        logger.info(f"Analytics retrieved", extra={
            'service': 'synapse_analytics',
            'operation': 'get_analytics',
            'total_videos': total_videos,
            'indexed_videos': indexed_videos,
            'duration_ms': 0,
            'status': 'success'
        })
        
        return AnalyticsData(
            total_videos=total_videos,
            total_duration=total_duration,
            indexed_videos=indexed_videos,
            failed_videos=failed_videos,
            top_keywords=top_keywords,
            top_topics=top_topics
        )
    
    @log_azure_operation('synapse_analytics', 'delete_video')
    async def delete_video(self, video_id: str):
        """
        Delete a video and its associated data from Synapse.
        
        Args:
            video_id: Video identifier
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Delete keywords
        cursor.execute("DELETE FROM video_keywords WHERE video_id = ?", (video_id,))
        
        # Delete topics
        cursor.execute("DELETE FROM video_topics WHERE video_id = ?", (video_id,))
        
        # Delete insights
        cursor.execute("DELETE FROM video_insights WHERE video_id = ?", (video_id,))
        
        # Delete video
        cursor.execute("DELETE FROM videos WHERE video_id = ?", (video_id,))
        
        conn.commit()
        cursor.close()
        
        logger.info(f"Video deleted from Synapse", extra={
            'service': 'synapse_analytics',
            'operation': 'delete_video',
            'video_id': video_id,
            'duration_ms': 0,
            'status': 'success'
        })


# Singleton instance
synapse_analytics_service = SynapseAnalyticsService()
