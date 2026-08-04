import { DocumentPermissionLevel } from '@prisma/client';

export interface ShareDocumentRequest {
  email: string;
  permission: DocumentPermissionLevel;
}

export interface UpdatePermissionRequest {
  permission: DocumentPermissionLevel;
}

export interface DocumentPermissionResponse {
  id: string;
  permission: DocumentPermissionLevel;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ShareDocumentResponse {
  success: boolean;
  permission?: DocumentPermissionResponse;
  message?: string;
}

export interface DocumentAccessInfo {
  documentId: string;
  userPermission: DocumentPermissionLevel | null;
  isOwner: boolean;
  hasAccess: boolean;
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 403
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class DocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document with id ${documentId} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class UserNotFoundError extends Error {
  constructor(email: string) {
    super(`User with email ${email} not found`);
    this.name = 'UserNotFoundError';
  }
}