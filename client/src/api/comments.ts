import api from './http';
import type { Comment } from '../types';

export const getComments = async (roomId: string): Promise<Comment[]> => {
  const res = await api.get(`/comments/${roomId}`);
  return res.data;
};

export const createComment = async (
  roomId: string,
  data: {
    targetId: string;
    targetType: 'node' | 'edge';
    body: string;
    parentId?: string | null;
  },
): Promise<Comment> => {
  const res = await api.post(`/comments/${roomId}`, {
    roomId,
    targetId: data.targetId,
    targetType: data.targetType,
    body: data.body,
    parentId: data.parentId ?? undefined,
  });
  return res.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};
