import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { CanvasStateModule } from './canvas/canvas-state.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // ConfigModule reads the .env file and makes values available everywhere
    ConfigModule.forRoot({ isGlobal: true}),

    // TypeORM connects to PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        // tells TypeORM where to find our entity files (table definitions)
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // synchronize: true automatically creates/updates tables based on
        // our entity files. ONLY use this in development — never production
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    RoomsModule,
    CanvasStateModule,
  ],
})
export class AppModule {}
