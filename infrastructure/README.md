# Infrastructure Deployment Guide

This directory contains Infrastructure as Code (IaC) templates for deploying the Azure Video Streaming Platform to your Azure subscription.

## Target Deployment

- **Subscription ID**: `c171632e-0fc9-4a06-bb7c-249f3d3e8cd6`
- **Resource Group**: `ME-MngEnvMCAP012810-rasalman-1`
- **Location**: `East US`

## Deployment Options

You can deploy the infrastructure using either **Terraform** or **Azure Bicep**.

### Option 1: Deploy with Terraform

#### Prerequisites
- Azure CLI installed and authenticated
- Terraform >= 1.0 installed

#### Quick Deploy

```bash
cd terraform
./deploy.sh
```

The script will:
1. Verify Azure authentication
2. Set the correct subscription
3. Initialize Terraform
4. Create an execution plan
5. Prompt for confirmation
6. Deploy the infrastructure

#### Manual Deployment

If you prefer to run the commands manually:

```bash
cd terraform

# Login to Azure
az login
az account set --subscription c171632e-0fc9-4a06-bb7c-249f3d3e8cd6

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply

# View outputs
terraform output
```

#### Configuration

The deployment is pre-configured in `terraform.tfvars` with:
- Storage account: `videostream012810`
- Video Indexer: `videoindexer012810`
- Synapse workspace: `videosynapse012810`
- Front Door: `videofrontdoor012810`

**Important**: These names must be globally unique. If deployment fails due to name conflicts, update the values in `terraform.tfvars`.

### Option 2: Deploy with Azure Bicep

#### Prerequisites
- Azure CLI installed and authenticated

#### Quick Deploy

```bash
cd bicep
./deploy.sh
```

The script will:
1. Verify Azure authentication
2. Set the correct subscription
3. Validate the Bicep template
4. Prompt for confirmation
5. Deploy the infrastructure

#### Manual Deployment

```bash
cd bicep

# Login to Azure
az login
az account set --subscription c171632e-0fc9-4a06-bb7c-249f3d3e8cd6

# Validate the template
az deployment group validate \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --template-file main.bicep \
  --parameters parameters.json

# Deploy
az deployment group create \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --template-file main.bicep \
  --parameters parameters.json

# View outputs
az deployment group show \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --name main \
  --query properties.outputs
```

#### Configuration

Edit `parameters.json` before deploying if you need to change:
- Resource names
- SQL admin password (recommended to change!)
- Environment settings

## Resources Deployed

The infrastructure deployment will create:

1. **Azure Storage Account**
   - For storing video files
   - Blob container named "videos"
   - CORS configured for web access

2. **Azure Video Analyzer** (Video Indexer)
   - For AI-powered video analysis
   - Managed identity enabled
   - Connected to storage account

3. **Azure Synapse Analytics**
   - Dedicated SQL pool for analytics
   - Separate storage account with Data Lake Gen2
   - SQL admin credentials

4. **Azure Front Door**
   - CDN profile for global distribution
   - Origin configured to blob storage
   - HTTPS-only routing

## Post-Deployment Steps

After successful deployment:

### 1. Get Deployment Outputs

**Terraform:**
```bash
cd terraform
terraform output -json > outputs.json
```

**Bicep:**
```bash
az deployment group show \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --name <deployment-name> \
  --query properties.outputs \
  > outputs.json
```

### 2. Configure Application Environment

Create a `.env` file in the project root with the deployment outputs:

```bash
# From Terraform outputs
AZURE_STORAGE_CONNECTION_STRING="<from outputs>"
AZURE_STORAGE_CONTAINER_NAME="videos"
AZURE_VIDEO_INDEXER_ACCOUNT_ID="<from outputs>"
AZURE_VIDEO_INDEXER_LOCATION="eastus"
AZURE_FRONT_DOOR_ENDPOINT="<from outputs>"
AZURE_SYNAPSE_WORKSPACE_NAME="videosynapse012810"
AZURE_SYNAPSE_SQL_POOL_NAME="videoanalytics"
AZURE_SYNAPSE_CONNECTION_STRING="<from outputs>"
```

### 3. Initialize Synapse Database

Connect to the Synapse SQL pool and run the initialization scripts:

```bash
cd ../
sqlcmd -S videosynapse012810.sql.azuresynapse.net \
  -d videoanalytics \
  -U sqladminuser \
  -P '<your-password>' \
  -i synapse_sql_scripts.sql
```

### 4. Configure Video Indexer

1. Go to Azure Portal
2. Navigate to the Video Indexer resource
3. Get the subscription key from "Keys and Endpoint"
4. Add to your `.env` file:
   ```
   AZURE_VIDEO_INDEXER_SUBSCRIPTION_KEY="<your-key>"
   ```

## Security Considerations

### Important Security Notes

1. **SQL Password**: The default SQL password in `parameters.json` is a placeholder. **Change it before deploying!**

2. **Credentials Management**: Never commit the following to version control:
   - `.env` files
   - `terraform.tfstate` files (use remote state in production)
   - Output files containing secrets

3. **Access Control**: After deployment, configure:
   - Azure RBAC roles for team members
   - Storage account firewall rules
   - Synapse workspace firewall
   - Front Door WAF policies

4. **Managed Identity**: Consider using Managed Identity instead of connection strings in production

### Recommended Security Updates

```bash
# Enable storage account firewall
az storage account update \
  --name videostream012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --default-action Deny

# Add your IP to allowed list
az storage account network-rule add \
  --account-name videostream012810 \
  --resource-group ME-MngEnvMCAP012810-rasalman-1 \
  --ip-address <your-ip>
```

## Troubleshooting

### Common Issues

1. **Resource name already exists**
   - Resource names must be globally unique
   - Update names in `terraform.tfvars` or `parameters.json`

2. **Permission denied**
   - Verify you have Contributor role on the subscription
   - Check that your account is set: `az account show`

3. **Provider registration failed**
   - Some resource providers may not be registered
   - Register manually:
     ```bash
     az provider register --namespace Microsoft.Synapse
     az provider register --namespace Microsoft.Cdn
     az provider register --namespace Microsoft.VideoIndexer
     ```

4. **Deployment timeout**
   - Synapse workspace can take 10-15 minutes
   - Wait and check deployment status in Azure Portal

## Cost Estimation

Approximate monthly costs (East US region):

- **Storage Account**: ~$20-50 (depending on storage and transactions)
- **Synapse SQL Pool** (DW100c): ~$1,200-1,500
- **Front Door**: ~$35 + data transfer costs
- **Video Indexer**: Pay per minute of video indexed

**Cost Optimization Tips:**
- Pause Synapse SQL pool when not in use
- Use lifecycle policies for blob storage
- Monitor Front Door cache hit ratio
- Review Video Indexer usage regularly

## Cleanup

To remove all deployed resources:

**Terraform:**
```bash
cd terraform
terraform destroy
```

**Bicep/Manual:**
```bash
# Delete all resources in the resource group
az group delete --name ME-MngEnvMCAP012810-rasalman-1 --yes
```

## Support

For issues with deployment:
1. Check Azure Portal for detailed error messages
2. Review Terraform/Bicep logs
3. Verify all prerequisites are met
4. Check the main README for additional documentation
