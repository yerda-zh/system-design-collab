import api from './http';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData, Snapshot } from '../types';

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

export const saveSnapshot = async (
  roomId: string,
  name: string,
): Promise<Snapshot> => {
  const res = await api.post(`/snapshots/${roomId}`, { name });
  return res.data;
};

export const getSnapshots = async (roomId: string): Promise<Snapshot[]> => {
  const res = await api.get(`/snapshots/${roomId}`);
  return res.data;
};

export const deleteSnapshot = async (snapshotId: string): Promise<void> => {
  await api.delete(`/snapshots/${snapshotId}`);
};