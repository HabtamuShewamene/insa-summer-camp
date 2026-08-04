import { IsString, IsOptional, IsObject, MaxLength, MinLength } from 'class-validator';
import { PositionData } from '../types/comment.types';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(5000, { message: 'Comment content too long' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  selectedText?: string;

  @IsOptional()
  @IsObject()
  positionData?: PositionData;
}
