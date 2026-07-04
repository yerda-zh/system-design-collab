import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from './room.entity';
import { RoomMember } from './room-member.entity';
import { Comment } from '../database/entities/comment.entity';
import { Snapshot } from '../database/entities/snapshot.entity';
import { CanvasState } from '../database/entities/canvas-state.entity';
import { CanvasStateModule } from '../canvas/canvas-state.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMember, Comment, Snapshot, CanvasState]),
    forwardRef(() => CanvasStateModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
