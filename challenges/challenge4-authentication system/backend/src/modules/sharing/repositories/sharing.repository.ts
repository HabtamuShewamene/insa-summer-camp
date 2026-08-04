import { Injectable } from '@nestjs/common';
import { DocumentPermissionLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SharingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPermission(documentId: string, userId: string) {
    return this.prisma.documentPermission.findUnique({
      where: {
        documentId_userId: { documentId, userId },
      },
    });
  }

  findPermissionById(documentId: string, permissionId: string) {
    return this.prisma.documentPermission.findFirst({
      where: { id: permissionId, documentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  findPermissions(documentId: string) {
    return this.prisma.documentPermission.findMany({
      where: { documentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  upsertPermission(data: {
    documentId: string;
    userId: string;
    permission: DocumentPermissionLevel;
    createdById: string;
  }) {
    return this.prisma.documentPermission.upsert({
      where: {
        documentId_userId: {
          documentId: data.documentId,
          userId: data.userId,
        },
      },
      create: {
        documentId: data.documentId,
        userId: data.userId,
        permission: data.permission,
        createdById: data.createdById,
      },
      update: {
        permission: data.permission,
        createdById: data.createdById,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  updatePermission(permissionId: string, data: { permission: DocumentPermissionLevel }) {
    return this.prisma.documentPermission.update({
      where: { id: permissionId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  deletePermission(permissionId: string) {
    return this.prisma.documentPermission.delete({
      where: { id: permissionId },
    });
  }
}