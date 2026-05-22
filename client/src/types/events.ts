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
  activeUsers: { userId: string; displayName: string }[];
}

export interface OperationAckPayload {
  success: boolean;
  serverRevision: number;
  error?: string;
}