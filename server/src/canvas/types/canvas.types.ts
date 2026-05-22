export type NodeType =
  | 'database'
  | 'cache'
  | 'queue'
  | 'service'
  | 'loadBalancer'
  | 'apiGateway'
  | 'cdn';

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

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CanvasStateData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  revision: number;
}