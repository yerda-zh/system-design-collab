import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasState } from '../database/entities/canvas-state.entity';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class CanvasStateService {
  constructor(
    @InjectRepository(CanvasState)
    private canvasStateRepository: Repository<CanvasState>,
    private roomsService: RoomsService,
  ) {}

  async getCanvasState(roomId: string, userId: string) {
    // First verify the user has access to this room
    await this.roomsService.getRoom(roomId, userId);

    const state = await this.canvasStateRepository.findOne({
      where: { roomId },
    });

    // If no canvas state exists yet, return an empty one
    if (!state) {
      return { roomId, nodes: [], edges: [], revision: 0 };
    }

    return state;
  }

  async saveCanvasState(
    roomId: string,
    userId: string,
    nodes: object[],
    edges: object[],
  ) {
    // Verify access
    await this.roomsService.getRoom(roomId, userId);

    let state = await this.canvasStateRepository.findOne({
      where: { roomId },
    });

    if (!state) {
      // First save — create a new row
      state = this.canvasStateRepository.create({
        roomId,
        nodes,
        edges,
        revision: 1,
      });
    } else {
      // Subsequent save — update existing row and increment revision
      state.nodes = nodes;
      state.edges = edges;
      state.revision += 1;
    }

    await this.canvasStateRepository.save(state);

    return { revision: state.revision };
  }
}