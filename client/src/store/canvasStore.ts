import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type {Node, Edge, NodeChange, EdgeChange, Connection} from '@xyflow/react';
import type { NodeData } from '../types';

interface CanvasState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  revision: number;
  isDirty: boolean; // true if there are unsaved changes
  isApplyingRemote: boolean;  // true when applying a broadcast from another user

  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setRevision: (revision: number) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<NodeData>) => void;
  markSaved: () => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  setApplyingRemote: (value: boolean) => void;
  removeEdge: (edgeId: string) => void;
  removeNode: (nodeId: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  revision: 0,
  isDirty: false,
  isApplyingRemote: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setRevision: (revision) => set({ revision }),
  setApplyingRemote: (value) => set({ isApplyingRemote: value }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node<NodeData>[],
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
      isDirty: true,
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isDirty: true,
    })),

  deleteEdge: (edgeId: string) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      isDirty: true,
    })),

  deleteNode: (nodeId: string) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      isDirty: true,
    })),

  markSaved: () => set({ isDirty: false }),

  removeEdge: (edgeId: string) =>
    set((state) => {
      const newEdges = applyEdgeChanges(
        [{ type: 'remove', id: edgeId }],
        state.edges,
      );
      return { edges: newEdges, isDirty: true };
    }),

  removeNode: (nodeId: string) =>
    set((state) => ({
      nodes: applyNodeChanges(
        [{ type: 'remove', id: nodeId }],
        state.nodes,
      ),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      isDirty: true,
    })),
}));