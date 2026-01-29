# Outputs for Azure Video Streaming Platform

output "subscription_id" {
  description = "Azure subscription ID"
  value       = data.azurerm_resource_group.main.id
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = data.azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = data.azurerm_resource_group.main.location
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.videos.name
}

output "storage_connection_string" {
  description = "Connection string for storage account"
  value       = azurerm_storage_account.videos.primary_connection_string
  sensitive   = true
}

output "video_indexer_account_id" {
  description = "Video Indexer account ID"
  value       = azurerm_video_indexer_account.indexer.id
}

output "synapse_workspace_name" {
  description = "Synapse workspace name"
  value       = azurerm_synapse_workspace.main.name
}

output "synapse_sql_endpoint" {
  description = "Synapse SQL endpoint"
  value       = azurerm_synapse_workspace.main.connectivity_endpoints.sql
}

output "synapse_sql_admin_password" {
  description = "Synapse SQL admin password"
  value       = random_password.synapse_sql_password.result
  sensitive   = true
}

output "front_door_endpoint" {
  description = "Front Door endpoint URL"
  value       = "https://${azurerm_cdn_frontdoor_endpoint.videos.host_name}"
}

output "front_door_profile_name" {
  description = "Front Door profile name"
  value       = azurerm_cdn_frontdoor_profile.main.name
}
