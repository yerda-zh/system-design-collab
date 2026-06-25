import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check(): Promise<{ status: string; timestamp: string }> {
    await this.dataSource.query('SELECT 1');
    await this.redisService.ping();

    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
