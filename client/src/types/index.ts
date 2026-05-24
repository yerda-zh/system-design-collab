// Node types available in the component library
export type NodeType =
  | 'database'
  | 'cache'
  | 'queue'
  | 'service'
  | 'loadBalancer'
  | 'apiGateway'
  | 'cdn';

// Edge (connection) types
export type EdgeType = 'http' | 'grpc' | 'async' | 'pubsub';

export const EDGE_CONFIG: Record<EdgeType, { label: string; color: string; animated: boolean; strokeDasharray?: string }> = {
  http:   { label: 'HTTP/REST', color: '#6b7280', animated: false },
  grpc:   { label: 'gRPC',      color: '#2563eb', animated: false },
  async:  { label: 'Async',     color: '#d97706', animated: true  },
  pubsub: { label: 'Pub/Sub',   color: '#16a34a', animated: true  },
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