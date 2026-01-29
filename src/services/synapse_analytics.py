"""Azure Synapse Analytics service for video metadata and analytics."""
import pyodbc
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.config import settings
from src.models.video import Video, VideoInsights, AnalyticsData


class SynapseAnalyticsService:
    """Service for Azure Synapse Analytics integration."""
    
    def __init__(self):
        """Initialize the Synapse Analytics service."""
        self.connection_string = settings.azure_synapse_connection_string
        self.workspace_name = settings.azure_synapse_workspace_name
        self.sql_pool_name = settings.azure_synapse_sql_pool_name
        self.connection = None
    
    def get_connection(self):
        """Get a database connection."""
        if not self.connection_string:
            raise ValueError("Synapse connection string not configured")
        
        if not self.connection or self.connection.closed:
            self.connection = pyodbc.connect(self.connection_string)
        
        return self.connection
    
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
        
        return AnalyticsData(
            total_videos=total_videos,
            total_duration=total_duration,
            indexed_videos=indexed_videos,
            failed_videos=failed_videos,
            top_keywords=top_keywords,
            top_topics=top_topics
        )
    
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


# Singleton instance
synapse_analytics_service = SynapseAnalyticsService()
