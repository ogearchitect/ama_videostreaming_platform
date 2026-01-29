# Azure Video Streaming Platform Infrastructure

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "video-streaming-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
}

variable "video_indexer_account_name" {
  description = "Name of the Video Indexer account"
  type        = string
}

variable "synapse_workspace_name" {
  description = "Name of the Synapse workspace"
  type        = string
}

variable "front_door_name" {
  description = "Name of the Front Door profile"
  type        = string
}
