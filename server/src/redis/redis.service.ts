import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CanvasStateData } from '../canvas/types/canvas.types';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  // Redis key patterns — centralizing these prevents typos
  // and makes it easy to see all the keys we use
  private readonly CANVAS_KEY = (roomId: string) => `canvas:${roomId}`;
  private readonly ROOM_USERS_KEY = (roomId: string) => `room:${roomId}:users`;
  // Room expires from Redis 1 hour after last activity
  private readonly ROOM_TTL_SECONDS = 3600;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      // Retry connection up to 3 times before giving up
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  // --- Canvas State ---

  async getCanvasState(roomId: string): Promise<CanvasStateData | null> {
    const data = await this.client.get(this.CANVAS_KEY(roomId));
    if (!data) return null;
    return JSON.parse(data) as CanvasStateData;
  }

  async setCanvasState(roomId: string, state: CanvasStateData): Promise<void> {
    await this.client.set(
      this.CANVAS_KEY(roomId),
      JSON.stringify(state),
      'EX',
      this.ROOM_TTL_SECONDS,
    );
  }

  async incrementRevision(roomId: string): Promise<number> {
    const state = await this.getCanvasState(roomId);
    if (!state) return 0;
    state.revision += 1;
    await this.setCanvasState(roomId, state);
    return state.revision;
  }

  // Refresh the TTL so active rooms don't expire mid-session
  async refreshRoomTTL(roomId: string): Promise<void> {
    await this.client.expire(this.CANVAS_KEY(roomId), this.ROOM_TTL_SECONDS);
  }

  // --- Active Users ---

  async addActiveUser(roomId: string, userId: string, displayName: string): Promise<void> {
    await this.client.hset(this.ROOM_USERS_KEY(roomId), userId, displayName);
    await this.client.expire(this.ROOM_USERS_KEY(roomId), this.ROOM_TTL_SECONDS);
  }

  async removeActiveUser(roomId: string, userId: string): Promise<void> {
    await this.client.hdel(this.ROOM_USERS_KEY(roomId), userId);
  }

  async getActiveUsers(roomId: string): Promise<Record<string, string>> {
    return this.client.hgetall(this.ROOM_USERS_KEY(roomId));
  }

  async deleteRoomKeys(roomId: string): Promise<void> {
    await this.client.del(this.CANVAS_KEY(roomId), this.ROOM_USERS_KEY(roomId));
  }
}