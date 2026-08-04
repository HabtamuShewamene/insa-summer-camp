import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateDocumentContentDto {
  @IsNotEmpty()
  @IsObject()
  content: Record<string, any>;
}
