# Azure Video Streaming Platform - Terraform Configuration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Resource Group (using existing resource group)
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

# Storage Account for Videos
resource "azurerm_storage_account" "videos" {
  name                     = var.storage_account_name
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"
  
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
  
  tags = {
    Environment = var.environment
  }
}

# Blob Container for Videos
resource "azurerm_storage_container" "videos" {
  name                  = "videos"
  storage_account_name  = azurerm_storage_account.videos.name
  container_access_type = "private"
}

# Azure Video Indexer Account
resource "azurerm_video_analyzer" "indexer" {
  name                = var.video_indexer_account_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  storage_account {
    id = azurerm_storage_account.videos.id
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = {
    Environment = var.environment
  }
}

# Synapse Workspace
resource "azurerm_synapse_workspace" "main" {
  name                                 = var.synapse_workspace_name
  resource_group_name                  = data.azurerm_resource_group.main.name
  location                             = data.azurerm_resource_group.main.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.synapse.id
  sql_administrator_login              = "sqladminuser"
  sql_administrator_login_password     = random_password.synapse_sql_password.result
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = {
    Environment = var.environment
  }
}

# Storage Account for Synapse
resource "azurerm_storage_account" "synapse" {
  name                     = "${var.synapse_workspace_name}st"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  is_hns_enabled           = true
  
  tags = {
    Environment = var.environment
  }
}

resource "azurerm_storage_data_lake_gen2_filesystem" "synapse" {
  name               = "synapse"
  storage_account_id = azurerm_storage_account.synapse.id
}

# Random password for Synapse SQL admin
resource "random_password" "synapse_sql_password" {
  length  = 16
  special = true
}

# Synapse SQL Pool
resource "azurerm_synapse_sql_pool" "main" {
  name                 = "videoanalytics"
  synapse_workspace_id = azurerm_synapse_workspace.main.id
  sku_name             = "DW100c"
  create_mode          = "Default"
  
  tags = {
    Environment = var.environment
  }
}

# Azure Front Door
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = var.front_door_name
  resource_group_name = data.azurerm_resource_group.main.name
  sku_name            = "Standard_AzureFrontDoor"
  
  tags = {
    Environment = var.environment
  }
}

# Front Door Endpoint
resource "azurerm_cdn_frontdoor_endpoint" "videos" {
  name                     = "videos-endpoint"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  
  tags = {
    Environment = var.environment
  }
}

# Front Door Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "videos" {
  name                     = "videos-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  
  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }
  
  health_probe {
    path                = "/health"
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 100
  }
}

# Front Door Origin
resource "azurerm_cdn_frontdoor_origin" "blob_storage" {
  name                          = "blob-storage-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.videos.id
  
  enabled                        = true
  host_name                      = azurerm_storage_account.videos.primary_blob_host
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_storage_account.videos.primary_blob_host
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

# Front Door Route
resource "azurerm_cdn_frontdoor_route" "videos" {
  name                          = "videos-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.videos.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.videos.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.blob_storage.id]
  
  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  link_to_default_domain = true
  https_redirect_enabled = true
}
