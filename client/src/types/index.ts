// Node types available in the component library
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

// Edge (connection) types
export type EdgeType =
  | 'http'
  | 'grpc'
  | 'async'
  | 'pubsub'
  | 'websocket'
  | 'tcp'
  | 'dbProtocol'
  | 'eventStream'
  | 'internal'
  | 'webhook';

export const EDGE_CONFIG: Record<EdgeType, { label: string; color: string; animated: boolean; strokeDasharray?: string }> = {
  http:        { label: 'HTTP/REST',    color: '#6b7280', animated: false },
  grpc:        { label: 'gRPC',         color: '#2563eb', animated: false },
  async:       { label: 'Async',        color: '#d97706', animated: true  },
  pubsub:      { label: 'Pub/Sub',      color: '#16a34a', animated: true  },
  websocket:   { label: 'WebSocket',    color: '#8B5CF6', animated: true  },
  tcp:         { label: 'TCP',          color: '#64748B', animated: false },
  dbProtocol:  { label: 'DB Protocol',  color: '#2563EB', animated: false },
  eventStream: { label: 'Event Stream', color: '#EA580C', animated: true  },
  internal:    { label: 'Internal',     color: '#94A3B8', animated: false },
  webhook:     { label: 'Webhook',      color: '#F59E0B', animated: false },
};

// The data stored inside each node
export interface NodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
}

// A room as returned by the API
export interface Room {
  id: string;
  name: string;
  ownerId: string;
  inviteToken: string;
  createdAt: string;
}

// The logged in user
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Snapshot {
  id: string;
  roomId: string;
  name: string;
  nodes: object[];
  edges: object[];
  createdBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  roomId: string;
  targetId: string;
  targetType: 'node' | 'edge';
  body: string;
  authorId: string;
  authorName: string;
  parentId: string | null;
  createdAt: string;
}