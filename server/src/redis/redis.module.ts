import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

// @Global makes RedisService available everywhere without
// needing to import RedisModule in every module that uses it
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}