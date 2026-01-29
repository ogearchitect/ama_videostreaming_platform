# Azure Video Streaming Platform - Deployment Guide

## Prerequisites

Before deploying the video streaming platform, ensure you have:

1. **Azure Subscription** with appropriate permissions
2. **Azure CLI** installed and configured
3. **Terraform** (version >= 1.0) or **Azure Bicep** installed
4. **Python 3.8+** for local development
5. **Docker** (optional, for containerized deployment)

## Deployment Steps

### Option 1: Deploy with Terraform

1. **Navigate to Terraform directory:**
   ```bash
   cd infrastructure/terraform
   ```

2. **Create a `terraform.tfvars` file:**
   ```hcl
   resource_group_name         = "video-streaming-rg"
   location                    = "eastus"
   environment                 = "production"
   storage_account_name        = "videostreamingstorage"
   video_indexer_account_name  = "videoindexer"
   synapse_workspace_name      = "videosynapse"
   front_door_name            = "videofrontdoor"
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Review the deployment plan:**
   ```bash
   terraform plan
   ```

5. **Deploy the infrastructure:**
   ```bash
   terraform apply
   ```

6. **Note the outputs:**
   ```bash
   terraform output
   ```

### Option 2: Deploy with Azure Bicep

1. **Navigate to Bicep directory:**
   ```bash
   cd infrastructure/bicep
   ```

2. **Create a resource group:**
   ```bash
   az group create --name video-streaming-rg --location eastus
   ```

3. **Deploy the Bicep template:**
   ```bash
   az deployment group create \
     --resource-group video-streaming-rg \
     --template-file main.bicep \
     --parameters storageAccountName=videostrstorage \
                  videoIndexerAccountName=videoindexer \
                  synapseWorkspaceName=videosynapse \
                  frontDoorName=videofrontdoor \
                  sqlAdminPassword='YourSecurePassword123!'
   ```

4. **View deployment outputs:**
   ```bash
   az deployment group show \
     --resource-group video-streaming-rg \
     --name main \
     --query properties.outputs
   ```

### Post-Deployment Configuration

#### 1. Configure Synapse SQL Pool

```bash
# Connect to Synapse SQL Pool
sqlcmd -S videosynapse.sql.azuresynapse.net -d videoanalytics -U sqladminuser -P 'YourPassword'

# Run the SQL scripts
sqlcmd -S videosynapse.sql.azuresynapse.net -d videoanalytics -U sqladminuser -P 'YourPassword' -i ../synapse_sql_scripts.sql
```

#### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from deployment outputs
AZURE_STORAGE_CONNECTION_STRING=<from_terraform_output>
AZURE_STORAGE_CONTAINER_NAME=videos

AZURE_VIDEO_INDEXER_ACCOUNT_ID=<from_terraform_output>
AZURE_VIDEO_INDEXER_LOCATION=eastus
AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY=<get_from_azure_portal>
AZURE_VIDEO_INDEXER_RESOURCE_ID=<from_terraform_output>

AZURE_FRONT_DOOR_ENDPOINT=<from_terraform_output>

AZURE_SYNAPSE_WORKSPACE_NAME=videosynapse
AZURE_SYNAPSE_SQL_POOL_NAME=videoanalytics
AZURE_SYNAPSE_CONNECTION_STRING=<from_terraform_output>

API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
```

#### 3. Deploy the Application

**Option A: Local Deployment**
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

**Option B: Docker Deployment**
```bash
# Build Docker image
docker build -t video-streaming-platform .

# Run container
docker run -p 8000:8000 --env-file .env video-streaming-platform
```

**Option C: Azure App Service**
```bash
# Create App Service
az webapp up \
  --name video-streaming-api \
  --resource-group video-streaming-rg \
  --runtime "PYTHON:3.11" \
  --sku B1

# Configure environment variables
az webapp config appsettings set \
  --name video-streaming-api \
  --resource-group video-streaming-rg \
  --settings @.env
```

**Option D: Azure Container Instances**
```bash
# Push image to Azure Container Registry
az acr create --resource-group video-streaming-rg --name videostreamingacr --sku Basic
az acr build --registry videostreamingacr --image video-streaming-platform:latest .

# Deploy to Container Instances
az container create \
  --resource-group video-streaming-rg \
  --name video-streaming-container \
  --image videostreamingacr.azurecr.io/video-streaming-platform:latest \
  --dns-name-label video-streaming \
  --ports 8000 \
  --environment-variables @.env
```

## Verification

1. **Check API health:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Access API documentation:**
   Open `http://localhost:8000/docs` in your browser

3. **Test video upload:**
   ```bash
   curl -X POST "http://localhost:8000/api/videos/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test_video.mp4"
   ```

## Monitoring and Management

### Azure Monitor

1. Enable Application Insights for the API
2. Configure alerts for failures and performance issues
3. Set up dashboards for monitoring

### Front Door Analytics

1. View traffic analytics in Azure Portal
2. Monitor cache hit ratio
3. Review WAF logs

### Synapse Analytics

1. Monitor SQL pool usage
2. Review query performance
3. Set up data pipelines for automated analytics

## Troubleshooting

### Common Issues

1. **Storage connection failed:**
   - Verify connection string in .env
   - Check firewall rules on storage account

2. **Video Indexer API errors:**
   - Ensure subscription key is valid
   - Check account ID matches the resource

3. **Synapse connection timeout:**
   - Verify SQL pool is running
   - Check connection string format
   - Ensure firewall allows your IP

4. **Front Door not caching:**
   - Review caching policies
   - Check origin health
   - Verify routing rules

## Security Best Practices

1. **Use Azure Key Vault** for secrets management
2. **Enable Managed Identity** for Azure resource authentication
3. **Configure HTTPS only** for all endpoints
4. **Enable WAF** on Front Door
5. **Use private endpoints** for storage and Synapse
6. **Implement API authentication** (OAuth2, JWT)
7. **Enable audit logging** for all services

## Cost Optimization

1. **Use lifecycle policies** for blob storage
2. **Pause Synapse SQL pool** when not in use
3. **Configure appropriate Front Door tier** based on traffic
4. **Monitor Video Indexer usage** and quotas
5. **Use reserved capacity** for predictable workloads

## Backup and Disaster Recovery

1. **Enable geo-replication** for blob storage
2. **Configure backup** for Synapse SQL pool
3. **Document recovery procedures**
4. **Test failover scenarios**

## Scaling

1. **Horizontal scaling:** Deploy multiple API instances behind Front Door
2. **Vertical scaling:** Increase Synapse SQL pool DWU as needed
3. **Storage scaling:** Automatic with Azure Blob Storage
4. **CDN scaling:** Automatic with Front Door

## Next Steps

1. Implement authentication and authorization
2. Add video thumbnails generation
3. Implement live streaming support
4. Add user management features
5. Create mobile and web client applications
6. Set up CI/CD pipelines
7. Implement advanced analytics and ML models
