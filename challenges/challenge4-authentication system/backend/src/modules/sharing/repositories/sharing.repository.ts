import { PrismaClient, DocumentPermissionLevel, Prisma } from '@prisma/client';
import { DocumentPermissionResponse, DocumentAccessInfo } from '../types/sharing.types';

export class SharingRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getUserAccessInfo(documentId: string, userId: string): Promise<DocumentAccessInfo> {
    const document = await this.findDocumentById(documentId);
    
    if (!document) {
      return {
        documentId,
        userPermission: null,
        isOwner: false,
        hasAccess: false,
      };
    }

    const isOwner = document.ownerId === userId;
    
    if (isOwner) {
      return {
        documentId,
        userPermission: 'OWNER' as DocumentPermissionLevel,
        isOwner: true,
        hasAccess: true,
      };
    }

    const permission = await this.findUserPermission(documentId, userId);
    
    return {
      documentId,
      userPermission: permission?.permission || null,
      isOwner: false,
      hasAccess: !!permission,
    };
  }

  async createPermission(
    documentId: string,
    userId: string,
    permission: DocumentPermissionLevel,
    createdById: string
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updatePermission(
    permissionId: string,
    permission: DocumentPermissionLevel
  ) {
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
        createdBy: {
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getDocumentPermissions(documentId: string): Promise<DocumentPermissionResponse[]> {
    const permissions = await this.prisma.documentPermission.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
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

    return permissions.map((permission) => ({
      id: permission.id,
      permission: permission.permission,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      user: permission.user,
      createdBy: permission.createdBy,
    }));
  }

  async createOwnerPermission(documentId: string, ownerId: string) {
    // Check if owner permission already exists
    const existingPermission = await this.findUserPermission(documentId, ownerId);
    
    if (existingPermission) {
      return existingPermission;
    }

    return this.createPermission(documentId, ownerId, 'OWNER', ownerId);
  }

  async hasPermissionLevel(
    documentId: string,
    userId: string,
    requiredLevel: DocumentPermissionLevel
  ): Promise<boolean> {
    const accessInfo = await this.getUserAccessInfo(documentId, userId);
    
    if (!accessInfo.hasAccess) {
      return false;
    }

    const userLevel = accessInfo.userPermission!;
    
    // Permission hierarchy: OWNER > EDITOR > COMMENTER > VIEWER
    const permissionHierarchy: Record<DocumentPermissionLevel, number> = {
      OWNER: 4,
      EDITOR: 3,
      COMMENTER: 2,
      VIEWER: 1,
    };

    return permissionHierarchy[userLevel] >= permissionHierarchy[requiredLevel];
  }
}