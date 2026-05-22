import type { NodeType } from './index';

export type OperationType =
  | 'addNode'
  | 'deleteNode'
  | 'moveNode'
  | 'updateNode'
  | 'addEdge'
  | 'deleteEdge';

export interface BaseOperation {
  type: OperationType;
  roomId: string;
  userId: string;
  clientRevision: number;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: { label: string; nodeType: NodeType; [key: string]: unknown };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface AddNodeOperation extends BaseOperation {
  type: 'addNode';
  node: CanvasNode;
}

export interface DeleteNodeOperation extends BaseOperation {
  type: 'deleteNode';
  nodeId: string;
}

export interface MoveNodeOperation extends BaseOperation {
  type: 'moveNode';
  nodeId: string;
  x: number;
  y: number;
}

export interface UpdateNodeOperation extends BaseOperation {
  type: 'updateNode';
  nodeId: string;
  label: string;
}

export interface AddEdgeOperation extends BaseOperation {
  type: 'addEdge';
  edge: CanvasEdge;
}

export interface DeleteEdgeOperation extends BaseOperation {
  type: 'deleteEdge';
  edgeId: string;
}

export type CanvasOperation =
  | AddNodeOperation
  | DeleteNodeOperation
  | MoveNodeOperation
  | UpdateNodeOperation
  | AddEdgeOperation
  | DeleteEdgeOperation;