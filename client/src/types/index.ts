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
export type EdgeType = 'http' | 'grpc' | 'pubsub' | 'asyncQueue';

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