targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Project name')
param projectName string = '{{projectName}}'
