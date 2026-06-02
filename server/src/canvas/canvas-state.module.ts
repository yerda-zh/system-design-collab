import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasState } from '../database/entities/canvas-state.entity';
import { CanvasStateController } from './canvas-state.controller';
import { CanvasStateService } from './canvas-state.service';
import { CanvasSyncService } from './canvas-sync.service';
import { CanvasGateway } from './canvas.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { AuthModule } from '../auth/auth.module';
import { WarningsModule } from '../warnings/warnings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CanvasState]),
    RoomsModule,
    AuthModule,
    WarningsModule,
  ],
  controllers: [CanvasStateController],
  providers: [
    CanvasStateService,
    CanvasSyncService,
    CanvasGateway,
  ],
  exports: [CanvasStateService, CanvasSyncService, CanvasGateway],
})
export class CanvasStateModule {}