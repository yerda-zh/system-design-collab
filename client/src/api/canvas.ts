import api from './http';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '../types';

export const loadCanvas = async (roomId: string) => {
  const res = await api.get(`/canvas/${roomId}`);
  return res.data;
};

export const saveCanvas = async (
  roomId: string,
  nodes: Node<NodeData>[],
  edges: Edge[],
) => {
  const res = await api.put(`/canvas/${roomId}`, { nodes, edges });
  return res.data;
};