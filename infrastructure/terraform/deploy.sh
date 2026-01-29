#!/bin/bash
# Deployment script for Azure Video Streaming Platform using Terraform
# This script deploys the infrastructure to the specified Azure subscription and resource group

set -e

# Configuration
SUBSCRIPTION_ID="c171632e-0fc9-4a06-bb7c-249f3d3e8cd6"
RESOURCE_GROUP="ME-MngEnvMCAP012810-rasalman-1"
LOCATION="eastus"

echo "========================================="
echo "Azure Video Streaming Platform Deployment"
echo "========================================="
echo "Subscription: $SUBSCRIPTION_ID"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform is not installed. Please install it first."
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

# Navigate to Terraform directory
cd "$(dirname "$0")"

# Initialize Terraform
echo ""
echo "Initializing Terraform..."
terraform init

# Validate Terraform configuration
echo ""
echo "Validating Terraform configuration..."
terraform validate

# Plan the deployment
echo ""
echo "Planning Terraform deployment..."
terraform plan -out=tfplan

# Ask for confirmation
echo ""
read -p "Do you want to apply this plan? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Apply the deployment
echo ""
echo "Applying Terraform deployment..."
terraform apply tfplan

# Show outputs
echo ""
echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Resource details:"
terraform output

echo ""
echo "To view the outputs in JSON format, run:"
echo "  terraform output -json"
echo ""
echo "To configure your application, create a .env file in the root directory with:"
echo "  terraform output -json | jq -r 'to_entries[] | \"\\(.key | ascii_upcase)=\\(.value.value)\"'"
