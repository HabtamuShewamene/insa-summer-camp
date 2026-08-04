import { IsEnum } from 'class-validator';
import { DocumentPermissionLevel } from '@prisma/client';

export class UpdatePermissionDto {
  @IsEnum(DocumentPermissionLevel)
  permission: DocumentPermissionLevel;
}