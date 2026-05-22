import { create } from 'zustand';
import type { CursorPosition } from '../types/events';

export interface ActiveUser {
  userId: string;
  displayName: string;
}

interface CollaborationState {
  activeUsers: ActiveUser[];
  cursors: Map<string, CursorPosition>;
  isConnected: boolean;
  isJoined: boolean;

  setActiveUsers: (users: ActiveUser[]) => void;
  addActiveUser: (user: ActiveUser) => void;
  removeActiveUser: (userId: string) => void;
  updateCursor: (cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  setConnected: (connected: boolean) => void;
  setJoined: (joined: boolean) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  activeUsers: [],
  cursors: new Map(),
  isConnected: false,
  isJoined: false,

  setActiveUsers: (users) => set({ activeUsers: users }),

  addActiveUser: (user) =>
    set((state) => ({
      activeUsers: [...state.activeUsers.filter((u) => u.userId !== user.userId), user],
    })),

  removeActiveUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.userId !== userId),
    })),

  updateCursor: (cursor) =>
    set((state) => {
      const cursors = new Map(state.cursors);
      cursors.set(cursor.userId, cursor);
      return { cursors };
    }),

  removeCursor: (userId) =>
    set((state) => {
      const cursors = new Map(state.cursors);
      cursors.delete(userId);
      return { cursors };
    }),

  setConnected: (isConnected) => set({ isConnected }),
  setJoined: (isJoined) => set({ isJoined }),
}));