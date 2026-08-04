import { DocumentPermissionLevel } from '@prisma/client';

export interface SharedUser {
  id: string;
  name: string;
  email: string;
}

export interface DocumentPermissionResponse {
  id: string;
  documentId: string;
  userId: string;
  permission: DocumentPermissionLevel;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  user?: SharedUser;
  createdBy?: SharedUser;
}