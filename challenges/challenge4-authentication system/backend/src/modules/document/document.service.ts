import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RenameDocumentDto } from './dto/rename-document.dto';
import { UpdateDocumentContentDto } from './dto/update-content.dto';
import { VersionHistoryService } from '../version-history/version-history.service';
import { SharingService } from '../sharing/services/sharing.service';
import { DocumentPermissionLevel } from '@prisma/client';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionHistoryService: VersionHistoryService,
    private readonly sharingService: SharingService,
  ) {}

  async create(userId: string, dto: CreateDocumentDto) {
    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        ownerId: userId,
        content: {
          create: {
            content: { ops: [{ insert: '\n' }] },
          }
        },
        permissions: {
          create: {
            userId,
            createdById: userId,
            permission: DocumentPermissionLevel.OWNER,
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      }
    });

    return { document, message: 'Document created successfully' };
  }

  async findAll(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        permissions: {
          where: { userId },
          select: { permission: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return { documents };
  }

  async findRecent(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        isDeleted: false,
        lastOpenedAt: { not: null },
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        permissions: {
          where: { userId },
          select: { permission: true },
        },
      },
      orderBy: { lastOpenedAt: 'desc' },
      take: 10,
    });
    
    return { documents };
  }

  async findOne(userId: string, id: string) {
    const userPermission = await this.sharingService.assertAccess(id, userId, DocumentPermissionLevel.VIEWER);

    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        content: true,
        permissions: {
          select: {
            id: true,
            userId: true,
            permission: true,
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
    });

    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    return { document: { ...document, userPermission } };
  }

  async rename(userId: string, id: string, dto: RenameDocumentDto) {
    await this.sharingService.assertEditor(id, userId);

    const updated = await this.prisma.document.update({
      where: { id },
      data: { title: dto.title },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      }
    });

    await this.versionHistoryService.createSnapshotIfChanged({
      documentId: id,
      userId,
      title: updated.title,
      content: (await this.prisma.documentContent.findUnique({ where: { documentId: id } }))?.content,
      changeDescription: 'Renamed document',
      force: true,
    });

    return { document: updated, message: 'Document renamed successfully' };
  }

  async open(userId: string, id: string) {
    await this.sharingService.assertViewer(id, userId);

    await this.prisma.document.update({
      where: { id },
      data: { lastOpenedAt: new Date() },
    });

    return { message: 'Document opened' };
  }

  async duplicate(userId: string, id: string) {
    await this.sharingService.assertViewer(id, userId);

    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { content: true }
    });

    if (!document || document.isDeleted) throw new NotFoundException('Document not found');

    const duplicated = await this.prisma.document.create({
      data: {
        title: `Copy of ${document.title}`,
        ownerId: userId,
        content: {
          create: {
            content: document.content?.content || { ops: [{ insert: '\n' }] }
          }
        },
        permissions: {
          create: {
            userId,
            createdById: userId,
            permission: DocumentPermissionLevel.OWNER,
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      }
    });

    return { document: duplicated, message: 'Document duplicated successfully' };
  }

  async remove(userId: string, id: string) {
    await this.sharingService.assertOwner(id, userId);

    await this.prisma.document.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Document moved to trash' };
  }

  async updateContent(userId: string, id: string, dto: UpdateDocumentContentDto) {
    await this.sharingService.assertEditor(id, userId);

    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');

    await this.prisma.$transaction([
      this.prisma.documentContent.update({
        where: { documentId: id },
        data: { content: dto.content },
      }),
      this.prisma.document.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    await this.versionHistoryService.createSnapshotIfChanged({
      documentId: id,
      userId,
      title: document.title,
      content: dto.content,
      changeDescription: 'Auto-saved document changes',
    });

    return { message: 'Document content saved' };
  }
}
