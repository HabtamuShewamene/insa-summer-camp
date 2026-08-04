import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @MinLength(1, { message: 'Reply content cannot be empty' })
  @MaxLength(5000, { message: 'Reply content too long' })
  content: string;
}
