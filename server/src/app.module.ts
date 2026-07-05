import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { CanvasStateModule } from './canvas/canvas-state.module';
import { RedisModule } from './redis/redis.module';
import { WarningsModule } from './warnings/warnings.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { CommentsModule } from './comments/comments.module';
import { HealthModule } from './health/health.module';
import { validationSchema } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { abortEarly: false },
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10, name: 'global' }]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),

    RedisModule,
    AuthModule,
    RoomsModule,
    WarningsModule,
    CanvasStateModule,
    SnapshotsModule,
    CommentsModule,
    HealthModule,
  ],
})
export class AppModule {}
