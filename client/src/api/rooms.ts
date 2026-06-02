import api from './http';
import type { Room } from '../types';

export const createRoom = async (name: string): Promise<Room> => {
  const res = await api.post('/rooms', { name });
  return res.data;
};

export const getMyRooms = async (): Promise<Room[]> => {
  const res = await api.get('/rooms/my');
  return res.data;
};

export const getSharedRooms = async (): Promise<Room[]> => {
  const res = await api.get('/rooms/shared');
  return res.data;
};

export const joinRoom = async (inviteToken: string) => {
  const res = await api.post(`/rooms/join/${inviteToken}`);
  return res.data;
};

export const regenerateInvite = async (roomId: string) => {
  const res = await api.patch(`/rooms/${roomId}/regenerate-invite`);
  return res.data;
};

export const getInviteToken = async (
  roomId: string,
): Promise<{ inviteToken: string; roomName: string }> => {
  const res = await api.get(`/rooms/${roomId}/invite`);
  return res.data;
};

export const getRoom = async (roomId: string): Promise<Room> => {
  const res = await api.get(`/rooms/${roomId}`);
  return res.data;
};