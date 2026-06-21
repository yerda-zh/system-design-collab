import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CanvasGateway } from '../canvas/canvas.gateway';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly canvasGateway: CanvasGateway,
    private readonly authService: AuthService,
  ) {}

  @Post(':roomId')
  async createComment(
    @Param('roomId') roomId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const authorName = await this.authService.getUserDisplayName(req.user.id);
    const comment = await this.commentsService.createComment(
      roomId,
      req.user.id,
      authorName,
      dto,
    );
    this.canvasGateway.broadcastCommentCreated(roomId, comment);
    return comment;
  }

  @Get(':roomId')
  getComments(
    @Param('roomId') roomId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.getComments(roomId, req.user.id);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const { roomId } = await this.commentsService.deleteComment(
      commentId,
      req.user.id,
    );
    this.canvasGateway.broadcastCommentDeleted(roomId, commentId);
  }
}
