import { BadRequestException, ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
import { DocumentPermissionLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SharingRepository } from '../repositories/sharing.repository';
import { ShareDocumentDto } from '../dto/share-document.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { SocketServer } from '../../socket/socket.server';

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SharingRepository,
    private readonly socketServer: SocketServer,
  ) {}

  async resolvePermission(documentId: string, userId: string): Promise<DocumentPermissionLevel | null> {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.isDeleted) {
      return null;
    }

    if (document.ownerId === userId) {
      return DocumentPermissionLevel.OWNER;
    }

    const permission = await this.repository.findPermission(documentId, userId);
    return permission?.permission ?? null;
  }

  async assertAccess(documentId: string, userId: string, minimum: DocumentPermissionLevel): Promise<DocumentPermissionLevel> {
    const permission = await this.resolvePermission(documentId, userId);
    if (!permission) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const rank = this.permissionRank(permission);
    if (rank < this.permissionRank(minimum)) {
      throw new ForbiddenException('You do not have sufficient access to this document');
    }

    return permission;
  }

  async assertOwner(documentId: string, userId: string): Promise<void> {
    const permission = await this.resolvePermission(documentId, userId);
    if (permission !== DocumentPermissionLevel.OWNER) {
      throw new ForbiddenException('You do not have access to this document');
    }
  }

  async assertEditor(documentId: string, userId: string): Promise<void> {
    const permission = await this.resolvePermission(documentId, userId);
    if (!permission || this.permissionRank(permission) < this.permissionRank(DocumentPermissionLevel.EDITOR)) {
      throw new ForbiddenException('You do not have access to this document');
    }
  }

  async assertCommenter(documentId: string, userId: string): Promise<void> {
    const permission = await this.resolvePermission(documentId, userId);
    if (!permission || this.permissionRank(permission) < this.permissionRank(DocumentPermissionLevel.COMMENTER)) {
      throw new ForbiddenException('You do not have access to this document');
    }
  }

  async assertViewer(documentId: string, userId: string): Promise<void> {
    const permission = await this.resolvePermission(documentId, userId);
    if (!permission) {
      throw new ForbiddenException('You do not have access to this document');
    }
  }

  async getDocumentPermissions(documentId: string, userId: string) {
    await this.assertOwner(documentId, userId);
    return this.repository.findPermissions(documentId);
  }

  async shareDocument(documentId: string, ownerUserId: string, dto: ShareDocumentDto) {
    await this.assertOwner(documentId, ownerUserId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    const permission = targetUser.id === document.ownerId
      ? DocumentPermissionLevel.OWNER
      : dto.permission;

    const record = await this.repository.upsertPermission({
      documentId,
      userId: targetUser.id,
      createdById: ownerUserId,
      permission,
    });

    this.socketServer.broadcastDocumentShared(targetUser.id, {
      documentId,
      user: targetUser,
      permission: record.permission,
    });

    this.socketServer.broadcastPermissionUpdated(documentId, {
      documentId,
      permission: record.permission,
      userId: targetUser.id,
      permissionId: record.id,
    });

    return record;
  }

  async updatePermission(documentId: string, permissionId: string, ownerUserId: string, dto: UpdatePermissionDto) {
    await this.assertOwner(documentId, ownerUserId);

    const permissionRecord = await this.repository.findPermissionById(documentId, permissionId);
    if (!permissionRecord) {
      throw new NotFoundException('Permission not found');
    }

    if (permissionRecord.permission === DocumentPermissionLevel.OWNER) {
      throw new BadRequestException('Owner permission cannot be changed');
    }

    const updated = await this.repository.updatePermission(permissionId, {
      permission: dto.permission,
    });

    this.socketServer.broadcastPermissionUpdated(documentId, {
      documentId,
      permission: updated.permission,
      userId: updated.userId,
      permissionId: updated.id,
    });

    return updated;
  }

  async removePermission(documentId: string, permissionId: string, ownerUserId: string) {
    await this.assertOwner(documentId, ownerUserId);

    const permissionRecord = await this.repository.findPermissionById(documentId, permissionId);
    if (!permissionRecord) {
      throw new NotFoundException('Permission not found');
    }

    if (permissionRecord.permission === DocumentPermissionLevel.OWNER) {
      throw new BadRequestException('Owner permission cannot be removed');
    }

    await this.repository.deletePermission(permissionId);

    this.socketServer.broadcastPermissionRemoved(documentId, {
      documentId,
      permissionId,
      userId: permissionRecord.userId,
    });

    this.socketServer.broadcastDocumentAccessRevoked(permissionRecord.userId, {
      documentId,
      permissionId,
    });

    return { message: 'Access removed successfully' };
  }

  async getPermissionForUser(documentId: string, userId: string) {
    return this.resolvePermission(documentId, userId);
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