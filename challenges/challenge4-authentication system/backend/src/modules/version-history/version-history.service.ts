import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncService } from '../socket/sync.service';
import { SocketServer } from '../socket/socket.server';
import { VersionHistoryRepository } from './repositories/version-history.repository';
import { VersionHistoryValidator } from './validators/version-history.validator';
import { CreateVersionDto } from './dto/create-version.dto';
import { DocumentVersionDetail, DocumentVersionListItem, DocumentVersionSnapshot } from './types/version-history.types';

@Injectable()
export class VersionHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VersionHistoryRepository,
    private readonly validator: VersionHistoryValidator,
    private readonly syncService: SyncService,
    private readonly socketServer: SocketServer,
  ) {}

  async getVersions(documentId: string, userId: string): Promise<DocumentVersionListItem[]> {
    await this.assertDocumentOwner(documentId, userId);
    const versions = await this.repository.findVersions(documentId);
    return versions.map((version) => this.toListItem(version));
  }

  async getVersion(documentId: string, versionId: string, userId: string): Promise<DocumentVersionDetail> {
    await this.assertDocumentOwner(documentId, userId);
    const version = await this.repository.findVersionById(documentId, versionId);
    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.toDetail(version);
  }

  async createManualVersion(documentId: string, userId: string, dto: CreateVersionDto): Promise<DocumentVersionListItem | null> {
    await this.assertDocumentOwner(documentId, userId);
    const document = await this.getDocumentSnapshot(documentId);
    const snapshot: DocumentVersionSnapshot = {
      title: document.title,
      content: document.content?.content ?? { ops: [{ insert: '\n' }] },
    };

    return this.createSnapshotIfChanged({
      documentId,
      userId,
      title: snapshot.title,
      content: snapshot.content,
      changeDescription: dto.changeDescription || 'Manual snapshot',
      force: true,
    });
  }

  async createSnapshotIfChanged(params: {
    documentId: string;
    userId: string;
    title: string;
    content: Prisma.InputJsonValue | Prisma.JsonValue | null | undefined;
    changeDescription: string;
    force?: boolean;
    isRestored?: boolean;
  }): Promise<DocumentVersionListItem | null> {
    const { documentId, userId, title, content, changeDescription, force = false, isRestored = false } = params;
    const nextContent = content ?? { ops: [{ insert: '\n' }] };
    const latest = await this.repository.findLatestVersion(documentId);

    if (latest) {
      const isDuplicate = this.validator.isDuplicateSnapshot(latest, { title, content: nextContent });
      if (isDuplicate) {
        return null;
      }

      if (!force) {
        const shouldAutoCreate = this.validator.shouldAutoCreateVersion(latest, { title, content: nextContent });
        if (!shouldAutoCreate) {
          return null;
        }
      }
    }

    const version = await this.repository.createVersion({
      documentId,
      userId,
      title,
      content: nextContent,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      changeDescription,
      isRestored,
    });

    const response = this.toListItem(version);
    this.socketServer.broadcastVersionCreated(documentId, response);
    return response;
  }

  async restoreVersion(documentId: string, versionId: string, userId: string) {
    await this.assertDocumentOwner(documentId, userId);

    const currentDocument = await this.getDocumentSnapshot(documentId);
    const targetVersion = await this.repository.findVersionById(documentId, versionId);

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    const restoredSnapshot = {
      title: targetVersion.title,
      content: targetVersion.content,
    };

    const backupVersion = await this.repository.createVersion({
      documentId,
      userId,
      title: currentDocument.title,
      content: currentDocument.content?.content ?? { ops: [{ insert: '\n' }] },
      versionNumber: (await this.repository.getNextVersionNumber(documentId)) + 1,
      changeDescription: `Backup before restoring version ${targetVersion.versionNumber}`,
      isRestored: false,
    });

    const restoredVersion = await this.repository.createVersion({
      documentId,
      userId,
      title: restoredSnapshot.title,
      content: restoredSnapshot.content,
      versionNumber: backupVersion.versionNumber + 1,
      changeDescription: `Restored version ${targetVersion.versionNumber}`,
      isRestored: true,
    });

    await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id: documentId },
        data: { title: restoredSnapshot.title, updatedAt: new Date() },
      }),
      this.prisma.documentContent.update({
        where: { documentId },
        data: { content: restoredSnapshot.content },
      }),
    ]);

    this.syncService.replaceDocument(documentId, restoredSnapshot.content);
    const update = this.syncService.getUpdate(documentId);

    this.socketServer.broadcastVersionRestored(documentId, this.toListItem(restoredVersion));
    this.socketServer.broadcastDocumentRestored(documentId, {
      documentId,
      versionId: targetVersion.id,
      versionNumber: targetVersion.versionNumber,
      title: restoredSnapshot.title,
      content: restoredSnapshot.content,
    });
    this.socketServer.broadcastDocumentUpdate(documentId, Array.from(update));

    return {
      message: 'Document restored successfully',
      version: this.toDetail(targetVersion),
      backupVersion: this.toListItem(backupVersion),
      restoredVersion: this.toListItem(restoredVersion),
    };
  }

  private async getDocumentSnapshot(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { content: true },
    });

    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private async assertDocumentOwner(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }
  }

  private toListItem(version: any): DocumentVersionListItem {
    return {
      id: version.id,
      documentId: version.documentId,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      changeDescription: version.changeDescription,
      isRestored: version.isRestored,
      createdBy: {
        id: version.createdBy.id,
        name: version.createdBy.name,
        email: version.createdBy.email,
      },
    };
  }

  private toDetail(version: any): DocumentVersionDetail {
    return {
      ...this.toListItem(version),
      title: version.title,
      content: version.content,
    };
  }
}