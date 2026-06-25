import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity';
import { RoomsService } from '../rooms/rooms.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { sanitizeText } from '../common/utils/sanitize';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private roomsService: RoomsService,
  ) {}

  async createComment(
    roomId: string,
    userId: string,
    authorName: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    await this.roomsService.getRoom(roomId, userId);

    const comment = this.commentsRepository.create({
      roomId,
      targetId: dto.targetId,
      targetType: dto.targetType,
      body: sanitizeText(dto.body),
      authorId: userId,
      authorName,
      parentId: dto.parentId ?? null,
    });

    return this.commentsRepository.save(comment);
  }

  async getComments(roomId: string, userId: string): Promise<Comment[]> {
    await this.roomsService.getRoom(roomId, userId);

    return this.commentsRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ): Promise<{ roomId: string; commentId: string }> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.delete(commentId);
    return { roomId: comment.roomId, commentId };
  }
}
