export type NodeType =
  | 'database'
  | 'cache'
  | 'queue'
  | 'service'
  | 'loadBalancer'
  | 'apiGateway'
  | 'cdn'
  // Users & Clients
  | 'client'
  | 'mobileClient'
  | 'thirdParty'
  // Networking
  | 'dns'
  | 'firewall'
  | 'reverseProxy'
  // Storage
  | 'objectStorage'
  | 'blockStorage'
  | 'dataWarehouse'
  | 'searchEngine'
  | 'timeSeriesDb'
  // Compute
  | 'worker'
  | 'serverless'
  | 'containerOrchestrator'
  // Messaging
  | 'eventBus'
  | 'streamProcessor'
  // Observability
  | 'monitoring'
  | 'logging'
  // Identity & Security
  | 'identityProvider'
  | 'secretManager';

export interface NodeData {
  label: string;
  nodeType: NodeType;
  [key: string]: unknown;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface EdgeData {
  edgeType?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: EdgeData;
}

export interface CanvasStateData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  revision: number;
}