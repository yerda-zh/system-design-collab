// WebSocket event names — defined as constants to avoid typos
// Both server and client use these same strings
export const WS_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  CANVAS_OPERATION: 'canvasOperation',
  CANVAS_RESTORE: 'canvasRestore',
  CURSOR_MOVE: 'cursorMove',

  // Server → Client
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

export interface CursorPosition {
  userId: string;
  displayName: string;
  x: number;
  y: number;
}

export interface RoomStatePayload {
  nodes: object[];
  edges: object[];
  revision: number;
  activeUsers: ActiveUser[];
}

export interface ActiveUser {
  userId: string;
  displayName: string;
}

export interface OperationAckPayload {
  success: boolean;
  serverRevision: number;
  error?: string;
}