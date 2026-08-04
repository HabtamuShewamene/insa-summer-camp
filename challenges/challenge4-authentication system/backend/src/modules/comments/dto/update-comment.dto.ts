import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(5000, { message: 'Comment content too long' })
  content?: string;
}
