import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VersionHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findVersions(documentId: string) {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  findVersionById(documentId: string, versionId: string) {
    return this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  findLatestVersion(documentId: string) {
    return this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  getNextVersionNumber(documentId: string) {
    return this.prisma.documentVersion.count({ where: { documentId } });
  }

  createVersion(data: {
    documentId: string;
    userId: string;
    title: string;
    content: Prisma.InputJsonValue;
    versionNumber: number;
    changeDescription: string;
    isRestored: boolean;
  }) {
    return this.prisma.documentVersion.create({
      data: {
        documentId: data.documentId,
        createdById: data.userId,
        title: data.title,
        content: data.content,
        versionNumber: data.versionNumber,
        changeDescription: data.changeDescription,
        isRestored: data.isRestored,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}