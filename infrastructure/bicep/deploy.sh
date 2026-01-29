#!/bin/bash
# Deployment script for Azure Video Streaming Platform using Bicep
# This script deploys the infrastructure to the specified Azure subscription and resource group

set -e

# Configuration
SUBSCRIPTION_ID="c171632e-0fc9-4a06-bb7c-249f3d3e8cd6"
RESOURCE_GROUP="ME-MngEnvMCAP012810-rasalman-1"
LOCATION="eastus"
DEPLOYMENT_NAME="video-streaming-platform-$(date +%Y%m%d-%H%M%S)"

echo "========================================="
echo "Azure Video Streaming Platform Deployment"
echo "========================================="
echo "Subscription: $SUBSCRIPTION_ID"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Deployment Name: $DEPLOYMENT_NAME"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login to Azure (if not already logged in)
echo "Checking Azure authentication..."
az account show &> /dev/null || az login

# Set the subscription
echo "Setting subscription to $SUBSCRIPTION_ID..."
az account set --subscription "$SUBSCRIPTION_ID"

# Verify the resource group exists
echo "Verifying resource group $RESOURCE_GROUP exists..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "Error: Resource group $RESOURCE_GROUP does not exist."
    echo "Creating resource group..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Navigate to Bicep directory
cd "$(dirname "$0")"

# Validate Bicep template
echo ""
echo "Validating Bicep template..."
az deployment group validate \
  --resource-group "$RESOURCE_GROUP" \
  --template-file main.bicep \
  --parameters parameters.json

# Ask for confirmation
echo ""
read -p "Do you want to deploy the infrastructure? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy the Bicep template
echo ""
echo "Deploying Bicep template..."
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --template-file main.bicep \
  --parameters parameters.json

# Show outputs
echo ""
echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Deployment outputs:"
az deployment group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --query properties.outputs

echo ""
echo "To view the outputs in detail:"
echo "  az deployment group show --resource-group $RESOURCE_GROUP --name $DEPLOYMENT_NAME --query properties.outputs"
