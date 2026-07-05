import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  roomId: string;

  @IsString()
  @MaxLength(100)
  targetId: string;

  @IsString()
  @MaxLength(50)
  targetType: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
