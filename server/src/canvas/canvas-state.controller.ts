import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CanvasStateService } from './canvas-state.service';
import { SaveCanvasDto } from './dto/save-canvas.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@Controller('canvas')
@UseGuards(AuthGuard('jwt'))
export class CanvasStateController {
  constructor(private readonly canvasStateService: CanvasStateService) {}

  // GET /canvas/:roomId — load canvas state
  @Get(':roomId')
  getCanvasState(
    @Param('roomId') roomId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.canvasStateService.getCanvasState(roomId, req.user.id);
  }

  // PUT /canvas/:roomId — save canvas state
  @Put(':roomId')
  saveCanvasState(
    @Param('roomId') roomId: string,
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