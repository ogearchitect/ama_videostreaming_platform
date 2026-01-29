# CMAF Encoding with Azure AI Video Indexer

## Overview

This platform now supports **CMAF (Common Media Application Format)** encoding through Azure AI Video Indexer. CMAF is a modern streaming format that provides better compatibility across devices and enables adaptive bitrate streaming for optimal viewing experience.

## What is CMAF?

CMAF is an industry-standard streaming format that:
- Combines the benefits of HLS and DASH protocols
- Provides adaptive bitrate streaming for better user experience
- Ensures compatibility across multiple devices and platforms
- Reduces storage costs by using a single media format
- Enables faster streaming startup times

## Configuration

### Streaming Preset Options

The `streamingPreset` parameter controls how videos are encoded and prepared for streaming:

| Preset | Description | Use Case |
|--------|-------------|----------|
| `Default` | CMAF with adaptive bitrate (HLS/DASH) | **Recommended** - Modern streaming with device compatibility |
| `SingleBitrate` | Single fixed bitrate stream | Legacy devices or bandwidth-constrained scenarios |
| `NoStreaming` | Skip streaming asset creation | Analytics-only workflows |

### Environment Configuration

Add to your `.env` file:

```env
# Azure Video Indexer with CMAF support
AZURE_VIDEO_INDEXER_STREAMING_PRESET=Default
```

**Default Value**: `Default` (CMAF encoding enabled)

## Usage

### Automatic CMAF Encoding

By default, all videos uploaded to Azure Video Indexer will use CMAF encoding:

```python
from src.services.video_indexer import video_indexer_service

# Upload with default CMAF preset
indexer_video_id = await video_indexer_service.upload_video(
    video_url="https://storage.blob.core.windows.net/videos/sample.mp4",
    video_name="sample_video.mp4",
    video_id="video-123"
)
# Uses CMAF encoding automatically
```

### Custom Streaming Preset

Override the preset for specific videos:

```python
# Use single bitrate instead of adaptive
indexer_video_id = await video_indexer_service.upload_video(
    video_url="https://storage.blob.core.windows.net/videos/sample.mp4",
    video_name="sample_video.mp4",
    video_id="video-123",
    streaming_preset="SingleBitrate"
)
```

### Getting Streaming URLs

Retrieve CMAF-compatible streaming URLs:

```python
# Get streaming URL with format information
streaming_info = await video_indexer_service.get_streaming_url(
    indexer_video_id="video-indexer-123"
)

print(streaming_info)
# Output:
# {
#     'streaming_url': 'https://streaming.videoindexer.ai/...',
#     'format': 'CMAF',
#     'supports': ['HLS', 'DASH']
# }
```

## API Usage

### Video Upload Endpoint

The `/api/videos/upload` endpoint automatically uses CMAF encoding:

```bash
curl -X POST "http://localhost:8000/api/videos/upload" \
  -F "file=@video.mp4"
```

### Video Indexing Endpoint

When indexing a video, CMAF encoding is applied:

```bash
curl -X POST "http://localhost:8000/api/videos/{video_id}/index"
```

## Benefits

### 1. Adaptive Bitrate Streaming
CMAF enables automatic quality adjustment based on:
- Network bandwidth
- Device capabilities
- User preferences

### 2. Device Compatibility
Single CMAF stream works across:
- iOS devices (HLS)
- Android devices (DASH/HLS)
- Web browsers (DASH/HLS)
- Smart TVs
- Gaming consoles

### 3. Cost Efficiency
- Single encoded format instead of multiple
- Reduced storage requirements
- Lower bandwidth costs

### 4. Better User Experience
- Faster startup times
- Seamless quality switching
- Reduced buffering
- Improved playback smoothness

## Technical Details

### Encoding Process

When a video is uploaded with `streamingPreset=Default`:

1. **Upload**: Video is uploaded to Azure Video Indexer
2. **Encoding**: Video is encoded in CMAF format
3. **Packaging**: Both HLS and DASH manifests are created
4. **Indexing**: AI analysis extracts insights
5. **Streaming**: CMAF stream is ready for playback

### Streaming Formats Supported

CMAF encoding provides:
- **HLS (HTTP Live Streaming)**: Apple devices, Safari
- **DASH (Dynamic Adaptive Streaming over HTTP)**: Android, Chrome, Firefox
- **Smooth Streaming**: Legacy Microsoft devices

### Adaptive Bitrate Profiles

The `Default` preset creates multiple quality levels:
- 1080p (Full HD)
- 720p (HD)
- 480p (SD)
- 360p (Mobile)

Players automatically select the best quality based on conditions.

## Monitoring

CMAF encoding operations are logged with metrics:

```
Video uploaded to Video Indexer: sample.mp4
  - streaming_preset: Default
  - format: CMAF
  - supports: [HLS, DASH]
```

View logs in:
- Application Insights (if configured)
- Console output
- Log aggregation services

## Best Practices

### 1. Use Default Preset
For most scenarios, use `Default` preset for maximum compatibility:
```python
streaming_preset="Default"  # Recommended
```

### 2. Monitor Encoding Status
Check video processing status:
```python
status = await video_indexer_service.check_indexing_status(indexer_video_id)
# Wait for status == "Processed" before streaming
```

### 3. Cache Streaming URLs
CMAF URLs can be cached for performance:
```python
streaming_info = await video_indexer_service.get_streaming_url(video_id)
# Cache streaming_info['streaming_url'] for reuse
```

### 4. Test on Multiple Devices
Verify CMAF playback across:
- Different browsers (Chrome, Firefox, Safari)
- Mobile devices (iOS, Android)
- Various network conditions

## Troubleshooting

### Issue: Video not streaming

**Check**:
1. Verify `streamingPreset` is set to `Default`
2. Confirm video indexing is complete (`status == "Processed"`)
3. Validate streaming URL is accessible

### Issue: Poor playback quality

**Solution**:
- Ensure adaptive bitrate is enabled (`Default` preset)
- Check network bandwidth
- Verify player supports HLS/DASH

### Issue: Encoding takes too long

**Context**:
- CMAF encoding requires more processing than single bitrate
- Multiple quality levels are created
- Larger videos take longer to process

**Mitigation**:
- Use background processing
- Implement status polling
- Set user expectations with progress indicators

## Migration from Legacy Formats

If migrating from non-CMAF encoding:

1. **Update Configuration**:
   ```env
   AZURE_VIDEO_INDEXER_STREAMING_PRESET=Default
   ```

2. **Re-index Existing Videos** (optional):
   ```python
   # Re-upload with CMAF encoding
   await video_indexer_service.upload_video(
       video_url=video.blob_url,
       video_name=video.name,
       video_id=video.id,
       streaming_preset="Default"
   )
   ```

3. **Update Client Players**:
   Ensure video players support HLS or DASH protocols

## Examples

### Complete Upload Flow

```python
from src.services.blob_storage import blob_storage_service
from src.services.video_indexer import video_indexer_service

# 1. Upload to blob storage
video = await blob_storage_service.upload_video(
    file_data=file_data,
    filename="demo.mp4",
    content_type="video/mp4"
)

# 2. Index with CMAF encoding (automatic)
indexer_video_id = await video_indexer_service.upload_video(
    video_url=video.blob_url,
    video_name=video.name,
    video_id=video.id
    # streaming_preset="Default" is used by default
)

# 3. Wait for processing
status = await video_indexer_service.check_indexing_status(indexer_video_id)
while status != "Processed":
    await asyncio.sleep(10)
    status = await video_indexer_service.check_indexing_status(indexer_video_id)

# 4. Get CMAF streaming URL
streaming_info = await video_indexer_service.get_streaming_url(indexer_video_id)
print(f"Stream video at: {streaming_info['streaming_url']}")
print(f"Format: {streaming_info['format']}")  # CMAF
```

### HTML5 Video Player

```html
<!-- HLS playback with hls.js -->
<video id="video" controls></video>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
  var video = document.getElementById('video');
  var streamingUrl = 'CMAF_STREAMING_URL_HERE';
  
  if (Hls.isSupported()) {
    var hls = new Hls();
    hls.loadSource(streamingUrl);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    video.src = streamingUrl;
  }
</script>
```

## References

- [Azure Video Indexer Documentation](https://learn.microsoft.com/en-us/azure/azure-video-indexer/)
- [CMAF Specification](https://www.iso.org/standard/71975.html)
- [HLS Protocol](https://developer.apple.com/streaming/)
- [DASH Protocol](https://dashif.org/)

## Support

For issues or questions about CMAF encoding:
1. Check the troubleshooting section above
2. Review Application Insights logs
3. Consult Azure Video Indexer documentation
4. Contact support with encoding details and error logs
