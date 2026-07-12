import type { NodeTypes } from '@xyflow/react';
import BaseNode from './BaseNode';

// React Flow needs a map of node type names to components
// We use one BaseNode component for all types since
// the visual difference is handled by the nodeType in data
export const nodeTypes: NodeTypes = {
  database: BaseNode,
  cache: BaseNode,
  queue: BaseNode,
  service: BaseNode,
  loadBalancer: BaseNode,
  apiGateway: BaseNode,
  cdn: BaseNode,

  client: BaseNode,
  mobileClient: BaseNode,
  thirdParty: BaseNode,

  dns: BaseNode,
  firewall: BaseNode,
  reverseProxy: BaseNode,

  objectStorage: BaseNode,
  blockStorage: BaseNode,
  dataWarehouse: BaseNode,
  searchEngine: BaseNode,
  timeSeriesDb: BaseNode,

  worker: BaseNode,
  serverless: BaseNode,
  containerOrchestrator: BaseNode,

  eventBus: BaseNode,
  streamProcessor: BaseNode,

  monitoring: BaseNode,
  logging: BaseNode,

  identityProvider: BaseNode,
  secretManager: BaseNode,
};