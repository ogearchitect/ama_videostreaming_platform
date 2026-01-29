# Quick Start Guide - Azure Video Streaming Platform

This guide will help you deploy and run the video streaming platform on your Azure subscription.

## Pre-configured Settings

This repository is pre-configured for:
- **Subscription**: `c171632e-0fc9-4a06-bb7c-249f3d3e8cd6`
- **Resource Group**: `ME-MngEnvMCAP012810-rasalman-1`
- **Location**: `East US`

## Step 1: Deploy Infrastructure (Choose One Method)

### Option A: Using Terraform (Recommended)

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Run the deployment script
./deploy.sh
```

The script will guide you through the deployment process.

### Option B: Using Azure Bicep

```bash
# Navigate to bicep directory
cd infrastructure/bicep

# IMPORTANT: Edit parameters.json and change the SQL admin password!
nano parameters.json  # or use your preferred editor

# Run the deployment script
./deploy.sh
```

## Step 2: Get Deployment Outputs

After deployment completes, save the outputs:

```bash
# For Terraform
cd infrastructure/terraform
terraform output > ../../deployment-outputs.txt
terraform output -json > ../../deployment-outputs.json

# For Bicep
az deployment group show \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --name <deployment-name> \
  --query properties.outputs > deployment-outputs.json
```

## Step 3: Configure Application

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values from deployment outputs
nano .env
```

Update these values:
```env
AZURE_STORAGE_CONNECTION_STRING=<from deployment outputs>
AZURE_VIDEO_INDEXER_ACCOUNT_ID=<from deployment outputs>
AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY=<get from Azure Portal>
AZURE_FRONT_DOOR_ENDPOINT=<from deployment outputs>
AZURE_SYNAPSE_CONNECTION_STRING=<from deployment outputs>
```

## Step 4: Initialize Synapse Database

```bash
# Connect and run SQL scripts
sqlcmd -S videosynapse012810.sql.azuresynapse.net \
  -d videoanalytics \
  -U sqladminuser \
  -P '<your-password>' \
  -i infrastructure/synapse_sql_scripts.sql
```

## Step 5: Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Step 6: Run the Application

### Local Development

```bash
# Start the API server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Access the API
# - API: http://localhost:8000
# - Docs: http://localhost:8000/docs
# - Health: http://localhost:8000/health
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t video-streaming-platform .

# Run the container
docker run -p 8000:8000 --env-file .env video-streaming-platform
```

## Step 7: Test the API

### Using the Interactive Docs

1. Open http://localhost:8000/docs in your browser
2. Try the available endpoints:
   - GET `/` - API information
   - GET `/health` - Health check
   - GET `/api/videos` - List videos
   - POST `/api/videos/upload` - Upload a video
   - GET `/api/analytics/front-door` - Front Door config

### Using curl

```bash
# Check health
curl http://localhost:8000/health

# List videos
curl http://localhost:8000/api/videos

# Upload a video
curl -X POST "http://localhost:8000/api/videos/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_video.mp4"
```

## Step 8: Deploy to Azure (Optional)

### Deploy to Azure App Service

```bash
# Create App Service
az webapp up \
  --name video-streaming-api-012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --runtime "PYTHON:3.11" \
  --sku B1

# Configure environment variables
az webapp config appsettings set \
  --name video-streaming-api-012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --settings @.env
```

### Deploy to Azure Container Instances

```bash
# Create Azure Container Registry
az acr create \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --name videostreaming012810 \
  --sku Basic

# Build and push image
az acr build \
  --registry videostreaming012810 \
  --image video-streaming-platform:latest .

# Deploy container
az container create \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --name video-streaming-api \
  --image videostreaming012810.azurecr.io/video-streaming-platform:latest \
  --dns-name-label video-streaming-012810 \
  --ports 8000 \
  --environment-variables @.env
```

## Common Commands

### Check Deployment Status

```bash
# List all resources
az resource list \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --output table

# Check Synapse status
az synapse workspace show \
  --name videosynapse012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1

# Check Front Door status
az afd endpoint show \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --profile-name videofrontdoor012810 \
  --endpoint-name videos-endpoint
```

### Manage Synapse SQL Pool

```bash
# Pause SQL pool (to save costs)
az synapse sql pool pause \
  --name videoanalytics \
  --workspace-name videosynapse012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1

# Resume SQL pool
az synapse sql pool resume \
  --name videoanalytics \
  --workspace-name videosynapse012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1
```

### View Logs

```bash
# Local application logs
tail -f /tmp/api.log

# Azure App Service logs
az webapp log tail \
  --name video-streaming-api-012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1
```

## Troubleshooting

### Application won't start

1. Check `.env` file exists and has correct values
2. Verify Azure credentials are correct
3. Check Python dependencies are installed
4. Review logs for specific errors

### Video upload fails

1. Verify storage account connection string
2. Check blob container exists
3. Ensure storage account allows public access (or configure properly)
4. Check file size limits

### Video Indexer errors

1. Get API key from Azure Portal
2. Verify account ID is correct
3. Check subscription key is valid
4. Ensure Video Indexer service is enabled

### Synapse connection fails

1. Verify SQL pool is running (not paused)
2. Check firewall rules allow your IP
3. Verify connection string format
4. Ensure SQL admin credentials are correct

## Next Steps

1. **Add Authentication**: Implement OAuth2/JWT for API security
2. **Enable Monitoring**: Set up Application Insights
3. **Configure CORS**: Update CORS settings for your frontend
4. **Add Rate Limiting**: Implement API rate limiting
5. **Set up CI/CD**: Create GitHub Actions workflows
6. **Add More Tests**: Expand test coverage
7. **Implement Caching**: Add Redis for performance
8. **Create Frontend**: Build a web UI for the platform

## Resources

- [Main README](../README.md) - Full documentation
- [Deployment Guide](../DEPLOYMENT.md) - Detailed deployment instructions
- [Infrastructure README](../infrastructure/README.md) - IaC details
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## Cost Management

Monitor your Azure costs:

```bash
# View current costs
az consumption usage list \
  --subscription c171632e-0fc9-4a06-bb7c-249f3d3e8cd6 \
  --start-date $(date -d '30 days ago' +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(resourceGroup, 'ME-MngEnvMCAP012810-rasalman-1')]"
```

**Remember to pause Synapse SQL pool when not in use to reduce costs!**

## Getting Help

- Review error messages in Azure Portal
- Check application logs
- Consult Azure documentation
- Open an issue in the repository
