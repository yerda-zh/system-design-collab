import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CanvasStateService } from './canvas-state.service';
import { applyOperation } from './ot';
import { CanvasOperation } from './types/operations';
import { CanvasStateData } from './types/canvas.types';

export interface OperationResult {
  success: boolean;
  serverRevision: number;
  error?: string;
}

@Injectable()
export class CanvasSyncService {
  private readonly logger = new Logger(CanvasSyncService.name);

  // Track rooms that have unsaved changes
  // We flush these to PostgreSQL periodically
  private readonly dirtyRooms = new Set<string>();
  private flushInterval: NodeJS.Timeout;

  // Flush dirty rooms to PostgreSQL every 5 seconds
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(
    private readonly redisService: RedisService,
    private readonly canvasStateService: CanvasStateService,
  ) {
    this.startFlushInterval();
  }

  /**
   * Loads canvas state into Redis from PostgreSQL if not already there.
   * Called when the first user joins a room.
   */
  async warmRoom(roomId: string): Promise<CanvasStateData> {
    const cached = await this.redisService.getCanvasState(roomId);
    if (cached) return cached;

    // Room is cold — load from PostgreSQL
    const persisted = await this.canvasStateService.getRawState(roomId);

    const state: CanvasStateData = persisted
      ? {
          nodes: persisted.nodes as CanvasStateData['nodes'],
          edges: persisted.edges as CanvasStateData['edges'],
          revision: persisted.revision,
        }
      : { nodes: [], edges: [], revision: 0 };

    await this.redisService.setCanvasState(roomId, state);
    return state;
  }

  /**
   * Returns the current live canvas state, reading Redis first and falling
   * back to PostgreSQL for cold rooms. Used by snapshot creation so it
   * always captures the live state rather than the last 5-second flush.
   */
  async getLiveState(roomId: string): Promise<CanvasStateData> {
    const cached = await this.redisService.getCanvasState(roomId);
    if (cached) return cached;

    const persisted = await this.canvasStateService.getRawState(roomId);
    return persisted
      ? {
          nodes: persisted.nodes as CanvasStateData['nodes'],
          edges: persisted.edges as CanvasStateData['edges'],
          revision: persisted.revision,
        }
      : { nodes: [], edges: [], revision: 0 };
  }

  /**
   * Applies an operation to the live canvas state in Redis.
   * Handles revision checking and conflict resolution.
   */
  async applyOperation(
    operation: CanvasOperation,
  ): Promise<OperationResult> {
    const { roomId, clientRevision } = operation;

    try {
      const state = await this.redisService.getCanvasState(roomId);

      if (!state) {
        return {
          success: false,
          serverRevision: 0,
          error: 'Room state not found. Rejoin the room.',
        };
      }

      // Apply the operation regardless of revision mismatch
      // Our OT rules handle all conflict cases safely
      // (last-write-wins for moves, no-op for deletes of missing nodes, etc.)
      if (clientRevision < state.revision) {
        this.logger.debug(
          `Rebasing op ${operation.type} — client: ${clientRevision}, server: ${state.revision}`,
        );
      }

      const newState = applyOperation(state, operation);
      newState.revision = state.revision + 1;

      await this.redisService.setCanvasState(roomId, newState);
      await this.redisService.refreshRoomTTL(roomId);

      // Mark this room as needing a flush to PostgreSQL
      this.dirtyRooms.add(roomId);

      return { success: true, serverRevision: newState.revision };
    } catch (err) {
      this.logger.error(`Failed to apply operation in room ${roomId}`, err);
      return {
        success: false,
        serverRevision: 0,
        error: 'Failed to apply operation',
      };
    }
  }

  /**
   * Replaces the canvas state atomically in Redis and PostgreSQL.
   * Called when a user restores a snapshot. Persists immediately so the
   * 5-second flush cycle cannot overwrite the restored state with stale data.
   */
  async restoreState(
    roomId: string,
    nodes: CanvasStateData['nodes'],
    edges: CanvasStateData['edges'],
  ): Promise<number> {
    const state = await this.redisService.getCanvasState(roomId);
    const newRevision = (state?.revision ?? 0) + 1;
    const newState: CanvasStateData = { nodes, edges, revision: newRevision };

    await this.redisService.setCanvasState(roomId, newState);
    await this.redisService.refreshRoomTTL(roomId);
    await this.canvasStateService.persistState(roomId, newState);
    this.dirtyRooms.delete(roomId);

    return newRevision;
  }

  /**
   * Immediately flushes a room's state to PostgreSQL.
   * Called when the last user leaves a room.
   */
  async flushRoom(roomId: string): Promise<void> {
    const state = await this.redisService.getCanvasState(roomId);
    if (!state) return;

    await this.canvasStateService.persistState(roomId, state);
    this.dirtyRooms.delete(roomId);
    this.logger.debug(`Flushed room ${roomId} to PostgreSQL`);
  }

  /**
   * Periodically flushes all dirty rooms to PostgreSQL.
   * This runs every 5 seconds in the background.
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
        void this.flushDirtyRooms();
    }, this.FLUSH_INTERVAL_MS);
  }

  private async flushDirtyRooms(): Promise<void> {
    if (this.dirtyRooms.size === 0) return;

    const roomsToFlush = new Set(this.dirtyRooms);
    this.dirtyRooms.clear();

    for (const roomId of roomsToFlush) {
        await this.flushRoom(roomId);
    }
  }


  onModuleDestroy() {
    clearInterval(this.flushInterval);
  }
}