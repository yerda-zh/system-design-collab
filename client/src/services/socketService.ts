import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

export const WS_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  CANVAS_OPERATION: 'canvasOperation',
  CANVAS_RESTORE: 'canvasRestore',
  CURSOR_MOVE: 'cursorMove',
  ROOM_STATE: 'roomState',
  CANVAS_RESTORED: 'canvasRestored',
  OPERATION_BROADCAST: 'operationBroadcast',
  OPERATION_ACK: 'operationAck',
  CURSOR_BROADCAST: 'cursorBroadcast',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  ERROR: 'error',
  WARNING_UPDATE: 'warningUpdate',
  SNAPSHOT_CREATED: 'snapshotCreated',
  SNAPSHOT_DELETED: 'snapshotDeleted',
  COMMENT_CREATED: 'commentCreated',
  COMMENT_DELETED: 'commentDeleted',
} as const;

class SocketService {
  private socket: Socket | null = null;
  private pendingEmits: { event: string; data: unknown }[] = [];
  private onAuthErrorCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onReconnectCallback: (() => void) | null = null;

  onAuthError(callback: () => void): void {
    this.onAuthErrorCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  onReconnect(callback: () => void): void {
    this.onReconnectCallback = callback;
  }

  connect(): void {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().token;

    this.socket = io('http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    let wasConnected = false;

    this.socket.on('connect', () => {
      if (wasConnected) {
        // This is a reconnect, not the initial connect
        this.onReconnectCallback?.();
      }
      wasConnected = true;
      this.pendingEmits.forEach(({ event, data }) => {
        this.socket?.emit(event, data);
      });
      this.pendingEmits = [];
    });

    this.socket.on('disconnect', (_reason) => {
      this.onDisconnectCallback?.();
    });

    this.socket.on('connect_error', (err) => {
      if (
        err.message.toLowerCase().includes('unauthorized') ||
        err.message.toLowerCase().includes('invalid token') ||
        err.message.toLowerCase().includes('jwt')
      ) {
        this.onAuthErrorCallback?.();
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.pendingEmits = [];
    this.onAuthErrorCallback = null;
    this.onDisconnectCallback = null;
    this.onReconnectCallback = null;
  }

  emit(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.pendingEmits.push({ event, data });
    }
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.socket?.off(event, handler);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
