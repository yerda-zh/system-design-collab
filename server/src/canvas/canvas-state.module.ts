import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasState } from '../database/entities/canvas-state.entity';
import { CanvasStateController } from './canvas-state.controller';
import { CanvasStateService } from './canvas-state.service';
import { RoomsModule } from '../rooms/rooms.module';
import { AuthModule } from '../auth/auth.module';
import { CanvasSyncService } from './canvas-sync.service';
import { CanvasGateway } from './canvas.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([CanvasState]),
    RoomsModule,
    AuthModule,
  ],
  controllers: [CanvasStateController],
  providers: [
    CanvasStateService,
    CanvasSyncService,
    CanvasGateway,
  ],
  exports: [CanvasStateService, CanvasSyncService],
})
export class CanvasStateModule {}