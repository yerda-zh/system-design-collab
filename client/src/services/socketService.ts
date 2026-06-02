import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

// WebSocket event names — must match the server exactly
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
} as const;

class SocketService {
  private socket: Socket | null = null;
  // Queue of events to emit once the socket connects
  private pendingEmits: { event: string; data: unknown }[] = []
  private onAuthErrorCallback: (() => void) | null = null;

  onAuthError(callback: () => void): void {
    this.onAuthErrorCallback = callback;
  }


  connect(): void {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().token;

    this.socket = io('http://localhost:3001', {
      auth: { token },
      // Reconnect automatically if connection drops
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Flush any events that were emitted before connection was ready
      this.pendingEmits.forEach(({ event, data }) => {
        this.socket?.emit(event, data);
      });
      this.pendingEmits = [];
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      if (err.message.toLowerCase().includes('unauthorized') ||
          err.message.toLowerCase().includes('invalid token') ||
          err.message.toLowerCase().includes('jwt')) {
        this.onAuthErrorCallback?.();
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.pendingEmits = [];
    this.onAuthErrorCallback = null;
  }

  emit(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Socket not ready yet — queue the event
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

// Singleton — one socket connection for the entire app
export const socketService = new SocketService();