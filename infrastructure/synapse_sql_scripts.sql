-- Azure Synapse SQL Scripts for Video Streaming Platform
-- Run these scripts in your Synapse SQL Pool

-- Create Videos Table
CREATE TABLE videos (
    video_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    blob_url VARCHAR(1000) NOT NULL,
    status VARCHAR(50) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    indexed_at DATETIME,
    duration FLOAT,
    size_bytes BIGINT,
    content_type VARCHAR(100)
);

-- Create Video Insights Table
CREATE TABLE video_insights (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    transcript TEXT,
    language VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);

-- Create Video Keywords Table
CREATE TABLE video_keywords (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    keyword VARCHAR(500) NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);

-- Create Video Topics Table
CREATE TABLE video_topics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    topic VARCHAR(500) NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_uploaded_at ON videos(uploaded_at);
CREATE INDEX idx_video_keywords_video_id ON video_keywords(video_id);
CREATE INDEX idx_video_topics_video_id ON video_topics(video_id);

-- View: Video Statistics
CREATE VIEW video_statistics AS
SELECT 
    COUNT(*) as total_videos,
    SUM(CASE WHEN status = 'indexed' THEN 1 ELSE 0 END) as indexed_videos,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_videos,
    SUM(duration) as total_duration,
    AVG(duration) as avg_duration,
    SUM(size_bytes) as total_size_bytes
FROM videos;

-- View: Top Keywords
CREATE VIEW top_keywords AS
SELECT TOP 100
    keyword,
    COUNT(*) as count,
    COUNT(DISTINCT video_id) as video_count
FROM video_keywords
GROUP BY keyword
ORDER BY count DESC;

-- View: Top Topics
CREATE VIEW top_topics AS
SELECT TOP 100
    topic,
    COUNT(*) as count,
    COUNT(DISTINCT video_id) as video_count
FROM video_topics
GROUP BY topic
ORDER BY count DESC;

-- View: Video Details with Insights
CREATE VIEW video_details AS
SELECT 
    v.video_id,
    v.name,
    v.status,
    v.uploaded_at,
    v.indexed_at,
    v.duration,
    v.size_bytes,
    vi.transcript,
    vi.language,
    (SELECT COUNT(*) FROM video_keywords vk WHERE vk.video_id = v.video_id) as keyword_count,
    (SELECT COUNT(*) FROM video_topics vt WHERE vt.video_id = v.video_id) as topic_count
FROM videos v
LEFT JOIN video_insights vi ON v.video_id = vi.video_id;

-- Sample Queries

-- Get videos uploaded in the last 7 days
SELECT * FROM videos
WHERE uploaded_at >= DATEADD(day, -7, GETDATE())
ORDER BY uploaded_at DESC;

-- Get videos with the most keywords
SELECT 
    v.video_id,
    v.name,
    COUNT(vk.keyword) as keyword_count
FROM videos v
INNER JOIN video_keywords vk ON v.video_id = vk.video_id
GROUP BY v.video_id, v.name
ORDER BY keyword_count DESC;

-- Get processing success rate by day
SELECT 
    CAST(uploaded_at AS DATE) as upload_date,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'indexed' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    CAST(SUM(CASE WHEN status = 'indexed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate
FROM videos
GROUP BY CAST(uploaded_at AS DATE)
ORDER BY upload_date DESC;
