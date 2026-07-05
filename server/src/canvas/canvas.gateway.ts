import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { CanvasSyncService } from './canvas-sync.service';
import { RoomsService } from '../rooms/rooms.service';
import { WarningEngineService } from '../warnings/warning-engine.service';
import { WS_EVENTS } from './types/events';
import type { CanvasOperation } from './types/operations';
import type { CanvasNode, CanvasEdge } from './types/canvas.types';
import type { CursorPosition } from './types/events';

interface SocketData {
  userId: string;
  email: string;
}

// Store connected socket metadata in memory
// Map<socketId, { userId, displayName, roomId }>
const socketMeta = new Map<string, { userId: string; displayName: string; roomId: string }>();

// Track last cursor event time per socket to throttle at ~60fps max
const cursorLastSeen = new Map<string, number>();

// Debounce timers per room — warning analysis runs 500ms after
// the last operation in a room, not after every single operation
const warningDebounceTimers = new Map<string, NodeJS.Timeout>();

const wsAllowedOrigins = (
  process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173'
).split(',');

@WebSocketGateway({
  cors: {
    origin: wsAllowedOrigins,
    credentials: true,
  },
})
export class CanvasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(CanvasGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly canvasSyncService: CanvasSyncService,
    private readonly roomsService: RoomsService,
    private readonly warningEngineService: WarningEngineService,
  ) {}

  /**
   * Called automatically when a client connects.
   * We validate the JWT here — if invalid, disconnect immediately.
   */
  handleConnection(socket: Socket): void {
    try {
      const token = this.extractToken(socket);

      if (!token) {
        this.logger.warn(`Socket ${socket.id} connected without token`);
        socket.emit(WS_EVENTS.ERROR, { message: 'unauthorized' });
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        token,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );

      // Attach userId to the socket for use in subsequent events
      const data = socket.data as SocketData;
      data.userId = payload.sub;
      data.email = payload.email;

      this.logger.debug(`Socket connected: ${socket.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Socket ${socket.id} — invalid token, disconnecting`);
      socket.emit(WS_EVENTS.ERROR, { message: 'unauthorized' });
      socket.disconnect();
    }
  }

  /**
   * Called automatically when a client disconnects.
   * Clean up Redis and notify room members.
   */
  async handleDisconnect(socket: Socket): Promise<void> {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const { userId, displayName, roomId } = meta;

    await this.redisService.removeActiveUser(roomId, userId);
    socketMeta.delete(socket.id);
    cursorLastSeen.delete(socket.id);

    // Check if this was the last user in the room
    const remaining = await this.redisService.getActiveUsers(roomId);
    const isLastUser = Object.keys(remaining).length === 0;

    if (isLastUser) {
      // Flush canvas to PostgreSQL immediately when room empties
      await this.canvasSyncService.flushRoom(roomId);
    }

    // Notify remaining users
    socket.to(roomId).emit(WS_EVENTS.USER_LEFT, { userId, displayName });
    this.logger.debug(`User ${userId} left room ${roomId}`);
  }

  /**
   * Client sends this when they open a canvas room.
   * Server loads the canvas state and sends it back.
   */
  @SubscribeMessage(WS_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; displayName: string },
  ): Promise<void> {
    const socketData = socket.data as SocketData;
    const userId = socketData.userId;
    const { roomId, displayName } = data;

    // Verify the user actually has access to this room
    try {
      await this.roomsService.getRoom(roomId, userId);
    } catch {
      // Distinguish deleted room from genuine access denial:
      // cascade delete removes room_members before the room row, so getRoom
      // throws ForbiddenException (not NotFoundException) for deleted rooms.
      const exists = await this.roomsService.roomExists(roomId);
      if (!exists) {
        socket.emit(WS_EVENTS.ROOM_NOT_FOUND);
      } else {
        socket.emit(WS_EVENTS.ERROR, { message: 'Access denied to this room' });
      }
      return;
    }

    // Join the Socket.IO room — this groups all sockets in this room
    // so we can broadcast to all of them at once
    await socket.join(roomId);

    // Store metadata for this socket
    socketMeta.set(socket.id, { userId, displayName, roomId });

    // Load canvas into Redis if not already there
    const state = await this.canvasSyncService.warmRoom(roomId);

    // Add user to active users in Redis
    await this.redisService.addActiveUser(roomId, userId, displayName);

    // Get all active users for this room
    const activeUsersMap = await this.redisService.getActiveUsers(roomId);
    const activeUsers = Object.entries(activeUsersMap).map(([uid, name]) => ({
      userId: uid,
      displayName: name,
    }));

    // Send the current canvas state only to the joining user
    socket.emit(WS_EVENTS.ROOM_STATE, {
      nodes: state.nodes,
      edges: state.edges,
      revision: state.revision,
      activeUsers,
    });

    // Run warning analysis immediately so the joining user
    // sees current warnings without having to make a change first
    const warnings = this.warningEngineService.analyze(state);
    socket.emit(WS_EVENTS.WARNING_UPDATE, { warnings });

    // Notify everyone else in the room that a new user joined
    socket.to(roomId).emit(WS_EVENTS.USER_JOINED, { userId, displayName });

    this.logger.debug(`User ${userId} joined room ${roomId}`);
  }

  /**
   * Client sends this when they make a change to the canvas.
   */
  @SubscribeMessage(WS_EVENTS.CANVAS_OPERATION)
  async handleCanvasOperation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() operation: CanvasOperation,
  ): Promise<void> {
    const socketData = socket.data as SocketData;
    const userId = socketData.userId;

    // Ensure the operation is attributed to the authenticated user
    // Never trust the userId from the client payload
    operation.userId = userId;

    const result = await this.canvasSyncService.applyOperation(operation);

    // Acknowledge back to the sender with the server revision
    socket.emit(WS_EVENTS.OPERATION_ACK, {
      success: result.success,
      serverRevision: result.serverRevision,
      error: result.error,
    });

    if (result.success) {
      // Broadcast to everyone EXCEPT the sender
      // The sender already applied the change locally
      socket.to(operation.roomId).emit(WS_EVENTS.OPERATION_BROADCAST, {
        ...operation,
        serverRevision: result.serverRevision,
      });

      // Schedule warning analysis after 500ms debounce
      // Cancels any previously scheduled analysis for this room
      this.scheduleWarningAnalysis(operation.roomId);
    }
  }

  /**
   * Client sends this when restoring a snapshot.
   * Updates Redis + PostgreSQL atomically and broadcasts the new state
   * to all other users so everyone sees the restored canvas immediately.
   */
  @SubscribeMessage(WS_EVENTS.CANVAS_RESTORE)
  async handleCanvasRestore(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; nodes: CanvasNode[]; edges: CanvasEdge[] },
  ): Promise<void> {
    const userId = (socket.data as SocketData).userId;

    // Typed destructuring keeps roomId/nodes/edges as concrete types in both
    // the CLI compiler and IDE language service, preventing any-propagation
    // into restoreState's return value.
    const { roomId, nodes, edges }: { roomId: string; nodes: CanvasNode[]; edges: CanvasEdge[] } = data;

    try {
      await this.roomsService.getRoom(roomId, userId);
    } catch {
      socket.emit(WS_EVENTS.ERROR, { message: 'Access denied to this room' });
      return;
    }

    const newRevision: number = await this.canvasSyncService.restoreState(
      roomId,
      nodes,
      edges,
    );

    // Acknowledge back to the sender with the new revision
    socket.emit(WS_EVENTS.OPERATION_ACK, {
      success: true,
      serverRevision: newRevision,
    });

    // Broadcast full restored state to all other users in the room
    socket.to(roomId).emit(WS_EVENTS.CANVAS_RESTORED, {
      nodes,
      edges,
      revision: newRevision,
    });

    this.scheduleWarningAnalysis(roomId);
  }

  /**
   * Client sends cursor position updates.
   * We broadcast to everyone else in the room — ephemeral, never saved.
   */
  @SubscribeMessage(WS_EVENTS.CURSOR_MOVE)
  handleCursorMove(
    @ConnectedSocket() socket: Socket,
    @MessageBody() cursor: Omit<CursorPosition, 'userId'>,
  ): void {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    // Throttle cursor broadcasts to max ~60fps (16ms minimum interval)
    const now = Date.now();
    const last = cursorLastSeen.get(socket.id) ?? 0;
    if (now - last < 16) return;
    cursorLastSeen.set(socket.id, now);

    socket.to(meta.roomId).emit(WS_EVENTS.CURSOR_BROADCAST, {
      userId: meta.userId,
      displayName: meta.displayName,
      x: cursor.x,
      y: cursor.y,
    });
  }

  /**
   * Schedules warning analysis for a room with a 500ms debounce.
   * If called again within 500ms, the previous timer is cancelled
   * and a new one starts. This prevents running analysis on every
   * keystroke during rapid editing.
   */
  private scheduleWarningAnalysis(roomId: string): void {
    const existing = warningDebounceTimers.get(roomId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      void this.runWarningAnalysis(roomId);
      warningDebounceTimers.delete(roomId);
    }, 500);

    warningDebounceTimers.set(roomId, timer);
  }

  private async runWarningAnalysis(roomId: string): Promise<void> {
    const state = await this.redisService.getCanvasState(roomId);
    if (!state) return;

    const warnings = this.warningEngineService.analyze(state);

    // Broadcast full warning list to all clients in the room
    this.server.to(roomId).emit(WS_EVENTS.WARNING_UPDATE, { warnings });

    this.logger.debug(
      `Warning analysis for room ${roomId}: ${warnings.length} warnings`,
    );
  }

  broadcastSnapshotCreated(roomId: string, snapshot: unknown): void {
    this.server.to(roomId).emit(WS_EVENTS.SNAPSHOT_CREATED, snapshot);
  }

  broadcastSnapshotDeleted(roomId: string, snapshotId: string): void {
    this.server.to(roomId).emit(WS_EVENTS.SNAPSHOT_DELETED, { snapshotId });
  }

  broadcastCommentCreated(roomId: string, comment: unknown): void {
    this.server.to(roomId).emit(WS_EVENTS.COMMENT_CREATED, comment);
  }

  broadcastCommentDeleted(roomId: string, commentId: string): void {
    this.server.to(roomId).emit(WS_EVENTS.COMMENT_DELETED, { commentId });
  }

  broadcastRoomDeleted(roomId: string): void {
    this.server.to(roomId).emit(WS_EVENTS.ROOM_DELETED, { roomId });
  }

  private extractToken(socket: Socket): string | null {
    // Token can come from auth handshake or query param
    const authToken = socket.handshake.auth?.token as string | undefined;
    const queryToken = socket.handshake.query?.token as string | undefined;
    return authToken ?? queryToken ?? null;
  }
}