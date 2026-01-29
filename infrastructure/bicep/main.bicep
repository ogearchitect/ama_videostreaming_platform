// Azure Video Streaming Platform - Bicep Template

@description('Name of the resource group')
param resourceGroupName string = 'video-streaming-rg'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Environment name')
param environment string = 'dev'

@description('Storage account name for videos')
param storageAccountName string

@description('Video Indexer account name')
param videoIndexerAccountName string

@description('Synapse workspace name')
param synapseWorkspaceName string

@description('Front Door profile name')
param frontDoorName string

@description('SQL Administrator login')
param sqlAdminLogin string = 'sqladminuser'

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

// Storage Account for Videos
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_GRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
  tags: {
    Environment: environment
    Project: 'VideoStreamingPlatform'
  }
}

// Blob Container
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/videos'
  properties: {
    publicAccess: 'None'
  }
}

// Azure AI Video Indexer Account
resource videoIndexer 'Microsoft.VideoIndexer/accounts@2024-01-01' = {
  name: videoIndexerAccountName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    storageServices: {
      resourceId: storageAccount.id
    }
  }
  tags: {
    Environment: environment
    Project: 'VideoStreamingPlatform'
  }
}

// Storage Account for Synapse
resource synapseStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${synapseWorkspaceName}storage'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    isHnsEnabled: true
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
  }
  tags: {
    Environment: environment
  }
}

// Synapse Filesystem
resource synapseFilesystem 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${synapseStorage.name}/default/synapse'
}

// Synapse Workspace
resource synapseWorkspace 'Microsoft.Synapse/workspaces@2021-06-01' = {
  name: synapseWorkspaceName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    defaultDataLakeStorage: {
      accountUrl: synapseStorage.properties.primaryEndpoints.dfs
      filesystem: 'synapse'
    }
    sqlAdministratorLogin: sqlAdminLogin
    sqlAdministratorLoginPassword: sqlAdminPassword
  }
  tags: {
    Environment: environment
  }
}

// Synapse SQL Pool
resource synapseSqlPool 'Microsoft.Synapse/workspaces/sqlPools@2021-06-01' = {
  parent: synapseWorkspace
  name: 'videoanalytics'
  location: location
  sku: {
    name: 'DW100c'
  }
  properties: {
    createMode: 'Default'
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// Azure Front Door Profile
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: frontDoorName
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  tags: {
    Environment: environment
  }
}

// Front Door Endpoint
resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoorProfile
  name: 'videos-endpoint'
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

// Front Door Origin Group
resource frontDoorOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoorProfile
  name: 'videos-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

// Front Door Origin
resource frontDoorOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: frontDoorOriginGroup
  name: 'blob-storage-origin'
  properties: {
    hostName: storageAccount.properties.primaryEndpoints.blob
    httpPort: 80
    httpsPort: 443
    originHostHeader: storageAccount.properties.primaryEndpoints.blob
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

// Outputs
output storageAccountName string = storageAccount.name
output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
output videoIndexerAccountId string = videoIndexer.id
output videoIndexerAccountName string = videoIndexer.name
output synapseWorkspaceName string = synapseWorkspace.name
output synapseSqlEndpoint string = synapseWorkspace.properties.connectivityEndpoints.sql
output frontDoorEndpoint string = 'https://${frontDoorEndpoint.properties.hostName}'
