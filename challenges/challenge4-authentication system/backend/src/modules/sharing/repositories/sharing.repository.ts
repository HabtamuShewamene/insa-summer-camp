import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentPermissionLevel } from '@prisma/client';

@Injectable()
export class SharingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentById(documentId: string) {
    return this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }

  async findUserPermission(documentId: string, userId: string) {
    return this.prisma.documentPermission.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId,
        },
      },
    });
  }

  async createPermission(
    documentId: string,
    userId: string,
    permission: DocumentPermissionLevel,
    createdById: string,
  ) {
    return this.prisma.documentPermission.create({
      data: {
        documentId,
        userId,
        permission,
        createdById,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getDocumentPermissions(documentId: string) {
    return this.prisma.documentPermission.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updatePermission(permissionId: string, permission: DocumentPermissionLevel) {
    return this.prisma.documentPermission.update({
      where: { id: permissionId },
      data: { permission },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deletePermission(permissionId: string) {
    return this.prisma.documentPermission.delete({
      where: { id: permissionId },
    });
  }

  async findPermissionById(permissionId: string) {
    return this.prisma.documentPermission.findUnique({
      where: { id: permissionId },
      include: {
        document: true,
      },
    });
  }

  async getUserAccessInfo(documentId: string, userId: string) {
    const document = await this.findDocumentById(documentId);
    
    if (!document) {
      return null;
    }

    const isOwner = document.ownerId === userId;
    
    if (isOwner) {
      return {
        permission: DocumentPermissionLevel.OWNER,
        hasAccess: true,
      };
    }

    const permission = await this.findUserPermission(documentId, userId);
    
    return {
      permission: permission?.permission || null,
      hasAccess: !!permission,
    };
  }
}