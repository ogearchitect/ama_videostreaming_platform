# Azure Video Streaming Platform - Deployment Configuration
# This file contains the specific values for deploying to your Azure subscription

resource_group_name         = "ME-MngEnvMCAP012810-rasalman-1"
location                    = "eastus"
environment                 = "production"

# Storage account name must be globally unique, lowercase, no hyphens
# Change this to a unique value for your deployment
storage_account_name        = "videostream012810"

# Video Indexer account name
video_indexer_account_name  = "videoindexer012810"

# Synapse workspace name (must be globally unique)
synapse_workspace_name      = "videosynapse012810"

# Front Door name (must be globally unique)
front_door_name            = "videofrontdoor012810"
