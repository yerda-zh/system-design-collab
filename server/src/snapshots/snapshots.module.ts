import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snapshot } from '../database/entities/snapshot.entity';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';
import { RoomsModule } from '../rooms/rooms.module';
import { CanvasStateModule } from '../canvas/canvas-state.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Snapshot]),
    RoomsModule,
    CanvasStateModule,
  ],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
})
export class SnapshotsModule {}
