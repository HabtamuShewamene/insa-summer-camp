import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentPermissionLevel } from '@prisma/client';
import { SharingService } from '../services/sharing.service';

@Injectable()
export class DocumentPermissionMiddleware {
  constructor(private readonly sharingService: SharingService) {}

  requireOwner(documentId: string, userId: string) {
    return this.requireLevel(documentId, userId, DocumentPermissionLevel.OWNER);
  }

  requireEditor(documentId: string, userId: string) {
    return this.requireLevel(documentId, userId, DocumentPermissionLevel.EDITOR);
  }

  requireCommenter(documentId: string, userId: string) {
    return this.requireLevel(documentId, userId, DocumentPermissionLevel.COMMENTER);
  }

  requireViewer(documentId: string, userId: string) {
    return this.requireLevel(documentId, userId, DocumentPermissionLevel.VIEWER);
  }

  private async requireLevel(documentId: string, userId: string, minimum: DocumentPermissionLevel) {
    const permission = await this.sharingService.getPermissionForUser(documentId, userId);

    if (!permission) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const rank = this.permissionRank(permission);
    if (rank < this.permissionRank(minimum)) {
      throw new ForbiddenException('You do not have sufficient permission for this action');
    }

    return permission;
  }

  private permissionRank(permission: DocumentPermissionLevel): number {
    const ranks: Record<DocumentPermissionLevel, number> = {
      [DocumentPermissionLevel.VIEWER]: 1,
      [DocumentPermissionLevel.COMMENTER]: 2,
      [DocumentPermissionLevel.EDITOR]: 3,
      [DocumentPermissionLevel.OWNER]: 4,
    };

    return ranks[permission];
  }
}