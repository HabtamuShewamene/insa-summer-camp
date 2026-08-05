import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DocumentPermissionLevel } from '@prisma/client';
import { SharingRepository } from '../repositories/sharing.repository';
import { ShareDocumentDto } from '../dto/share-document.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { MailService } from '@/modules/mail/mail.service';

@Injectable()
export class SharingService {
  constructor(
    private readonly repository: SharingRepository,
    private readonly mailService: MailService,
  ) {}

  private permissionRank(permission: DocumentPermissionLevel): number {
    return {
      [DocumentPermissionLevel.VIEWER]: 1,
      [DocumentPermissionLevel.COMMENTER]: 2,
      [DocumentPermissionLevel.EDITOR]: 3,
      [DocumentPermissionLevel.OWNER]: 4,
    }[permission];
  }

  async getPermissionForUser(documentId: string, userId: string): Promise<DocumentPermissionLevel | null> {
    const access = await this.repository.getUserAccessInfo(documentId, userId);
    return access?.permission ?? null;
  }

  async assertAccess(
    documentId: string,
    userId: string,
    minimum: DocumentPermissionLevel = DocumentPermissionLevel.VIEWER,
  ): Promise<DocumentPermissionLevel> {
    const document = await this.repository.findDocumentById(documentId);
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');

    const permission = await this.getPermissionForUser(documentId, userId);
    if (!permission || this.permissionRank(permission) < this.permissionRank(minimum)) {
      throw new ForbiddenException('You do not have sufficient permission for this action');
    }
    return permission;
  }

  async assertOwner(documentId: string, userId: string) {
    return this.assertAccess(documentId, userId, DocumentPermissionLevel.OWNER);
  }

  async assertEditor(documentId: string, userId: string) {
    return this.assertAccess(documentId, userId, DocumentPermissionLevel.EDITOR);
  }

  async assertCommenter(documentId: string, userId: string) {
    return this.assertAccess(documentId, userId, DocumentPermissionLevel.COMMENTER);
  }

  async assertViewer(documentId: string, userId: string) {
    return this.assertAccess(documentId, userId, DocumentPermissionLevel.VIEWER);
  }

  async shareDocument(documentId: string, userId: string, dto: ShareDocumentDto) {
    const document = await this.repository.findDocumentById(documentId);
    if (!document) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('Only the owner can share this document');

    // Case-insensitive email lookup
    const targetUser = await this.repository.findUserByEmail(dto.email.toLowerCase().trim());
    if (!targetUser) {
      throw new BadRequestException(
        'No account found with that email. The person must register first before you can share with them.',
      );
    }

    // Prevent sharing with yourself
    if (targetUser.id === userId) {
      throw new BadRequestException('You cannot share a document with yourself');
    }

    // Check if already shared
    const existing = await this.repository.findUserPermission(documentId, targetUser.id);
    if (existing) {
      // Update permission if it changed
      if (existing.permission !== dto.permission) {
        const updated = await this.repository.updatePermission(existing.id, dto.permission);
        return { success: true, permission: updated, updated: true };
      }
      throw new BadRequestException('Document already shared with this user at this permission level');
    }

    const permission = await this.repository.createPermission(
      documentId,
      targetUser.id,
      dto.permission,
      userId,
    );

    // Send invitation email (best-effort — don't fail the share if email fails)
    try {
      const [sharerUser, doc] = await Promise.all([
        this.repository.findUserById(userId),
        this.repository.findDocumentById(documentId),
      ]);
      await this.mailService.sendDocumentInvitation({
        toEmail: targetUser.email,
        toName: targetUser.name,
        fromName: sharerUser?.name ?? 'A CollabDocs user',
        documentTitle: doc?.title ?? 'Untitled Document',
        documentId,
        permission: dto.permission,
      });
    } catch (e) {
      // Log but don't throw — sharing succeeded even if email fails
      console.warn('[SharingService] Failed to send invitation email:', e);
    }

    return { success: true, permission, updated: false };
  }

  async getDocumentPermissions(documentId: string, userId: string) {
    const document = await this.repository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access
    const hasAccess = document.ownerId === userId || 
      await this.repository.findUserPermission(documentId, userId);
    
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    const permissions = await this.repository.getDocumentPermissions(documentId);
    
    return {
      success: true,
      permissions,
    };
  }

  async updatePermission(
    documentId: string,
    permissionId: string,
    userId: string,
    dto: UpdatePermissionDto,
  ) {
    const document = await this.repository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update permissions');
    }

    const permission = await this.repository.findPermissionById(permissionId);
    if (!permission || permission.documentId !== documentId) {
      throw new NotFoundException('Permission not found');
    }

    const updated = await this.repository.updatePermission(permissionId, dto.permission);

    return {
      success: true,
      permission: updated,
    };
  }

  async removePermission(documentId: string, permissionId: string, userId: string) {
    const document = await this.repository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can remove permissions');
    }

    const permission = await this.repository.findPermissionById(permissionId);
    if (!permission || permission.documentId !== documentId) {
      throw new NotFoundException('Permission not found');
    }

    await this.repository.deletePermission(permissionId);

    return {
      success: true,
    };
  }
}
