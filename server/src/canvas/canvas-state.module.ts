import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasState } from '../database/entities/canvas-state.entity';
import { CanvasStateController } from './canvas-state.controller';
import { CanvasStateService } from './canvas-state.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([CanvasState]), RoomsModule],
  controllers: [CanvasStateController],
  providers: [CanvasStateService],
  exports: [CanvasStateService],
})
export class CanvasStateModule {}