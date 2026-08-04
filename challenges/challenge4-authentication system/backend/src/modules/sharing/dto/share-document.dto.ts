import { IsEmail, IsEnum } from 'class-validator';
import { DocumentPermissionLevel } from '@prisma/client';

export class ShareDocumentDto {
  @IsEmail()
  email: string;

  @IsEnum(DocumentPermissionLevel)
  permission: DocumentPermissionLevel;
}