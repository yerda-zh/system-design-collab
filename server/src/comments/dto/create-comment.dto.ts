import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  roomId: string;

  @IsString()
  targetId: string;

  @IsString()
  targetType: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
