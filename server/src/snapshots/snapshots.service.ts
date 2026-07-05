import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snapshot } from '../database/entities/snapshot.entity';
import { RoomsService } from '../rooms/rooms.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { RedisService } from '../redis/redis.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { sanitizeText } from '../common/utils/sanitize';

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectRepository(Snapshot)
    private snapshotsRepository: Repository<Snapshot>,
    private roomsService: RoomsService,
    private canvasStateService: CanvasStateService,
    private redisService: RedisService,
  ) {}

  async createSnapshot(
    roomId: string,
    userId: string,
    dto: CreateSnapshotDto,
  ): Promise<Snapshot> {
    // Verify the user is a member of this room
    await this.roomsService.getRoom(roomId, userId);

    const live = await this.redisService.getCanvasState(roomId);
    const cold = live ? null : await this.canvasStateService.getRawState(roomId);
    const source = live ?? cold;

    const snapshot = this.snapshotsRepository.create({
      roomId,
      name: sanitizeText(dto.name),
      nodes: source?.nodes ?? [],
      edges: source?.edges ?? [],
      createdBy: userId,
    });

    return this.snapshotsRepository.save(snapshot);
  }

  async getSnapshots(roomId: string, userId: string): Promise<Snapshot[]> {
    // Verify the user is a member of this room
    await this.roomsService.getRoom(roomId, userId);

    return this.snapshotsRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async deleteSnapshot(snapshotId: string, userId: string): Promise<{ roomId: string }> {
    const snapshot = await this.snapshotsRepository.findOne({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    // Any room member may delete — getRoom throws ForbiddenException if not a member
    await this.roomsService.getRoom(snapshot.roomId, userId);

    await this.snapshotsRepository.delete(snapshotId);
    return { roomId: snapshot.roomId };
  }
}
