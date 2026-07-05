import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CanvasStateService } from './canvas-state.service';
import { SaveCanvasDto } from './dto/save-canvas.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@Controller('canvas')
@UseGuards(AuthGuard('jwt'), ThrottlerGuard)
export class CanvasStateController {
  constructor(private readonly canvasStateService: CanvasStateService) {}

  // GET /canvas/:roomId — load canvas state
  @Get(':roomId')
  getCanvasState(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.canvasStateService.getCanvasState(roomId, req.user.id);
  }

  // PUT /canvas/:roomId — save canvas state
  @Put(':roomId')
  saveCanvasState(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: SaveCanvasDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.canvasStateService.saveCanvasState(
      roomId,
      req.user.id,
      dto.nodes,
      dto.edges,
    );
  }
}