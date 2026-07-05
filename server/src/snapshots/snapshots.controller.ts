import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SnapshotsService } from './snapshots.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { CanvasGateway } from '../canvas/canvas.gateway';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@Controller('snapshots')
@UseGuards(AuthGuard('jwt'), ThrottlerGuard)
export class SnapshotsController {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly canvasGateway: CanvasGateway,
  ) {}

  // POST /snapshots/:roomId — save current canvas as a named snapshot
  @Post(':roomId')
  async createSnapshot(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateSnapshotDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const snapshot = await this.snapshotsService.createSnapshot(roomId, req.user.id, dto);
    this.canvasGateway.broadcastSnapshotCreated(roomId, snapshot);
    return snapshot;
  }

  // GET /snapshots/:roomId — list all snapshots for a room
  @Get(':roomId')
  getSnapshots(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.snapshotsService.getSnapshots(roomId, req.user.id);
  }

  // DELETE /snapshots/:snapshotId — delete a snapshot
  @Delete(':snapshotId')
  async deleteSnapshot(
    @Param('snapshotId', ParseUUIDPipe) snapshotId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const { roomId } = await this.snapshotsService.deleteSnapshot(snapshotId, req.user.id);
    this.canvasGateway.broadcastSnapshotDeleted(roomId, snapshotId);
  }
}
