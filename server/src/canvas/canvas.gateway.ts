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
import { WS_EVENTS } from './types/events';
import type { CanvasOperation } from './types/operations';
import type { CursorPosition } from './types/events';

interface SocketData {
  userId: string;
  email: string;
}

// Store connected socket metadata in memory
// Map<socketId, { userId, displayName, roomId }>
const socketMeta = new Map<string, { userId: string; displayName: string; roomId: string }>();

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
      socket.emit(WS_EVENTS.ERROR, { message: 'Access denied to this room' });
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
    }
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

    socket.to(meta.roomId).emit(WS_EVENTS.CURSOR_BROADCAST, {
      userId: meta.userId,
      displayName: meta.displayName,
      x: cursor.x,
      y: cursor.y,
    });
  }

  private extractToken(socket: Socket): string | null {
    // Token can come from auth handshake or query param
    const authToken = socket.handshake.auth?.token as string | undefined;
    const queryToken = socket.handshake.query?.token as string | undefined;
    return authToken ?? queryToken ?? null;
  }
}