import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RenameDocumentDto } from './dto/rename-document.dto';
import { UpdateDocumentContentDto } from './dto/update-content.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDocumentDto) {
    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        ownerId: userId,
        content: {
          create: {
            content: { ops: [{ insert: '\n' }] },
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
      where: { ownerId: userId, isDeleted: false },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return { documents };
  }

  async findRecent(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: { ownerId: userId, isDeleted: false, lastOpenedAt: { not: null } },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { lastOpenedAt: 'desc' },
      take: 10,
    });
    
    return { documents };
  }

  async findOne(userId: string, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        content: true,
      },
    });

    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return { document };
  }

  async rename(userId: string, id: string, dto: RenameDocumentDto) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('You do not have access to this document');

    const updated = await this.prisma.document.update({
      where: { id },
      data: { title: dto.title },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      }
    });

    return { document: updated, message: 'Document renamed successfully' };
  }

  async open(userId: string, id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('You do not have access to this document');

    await this.prisma.document.update({
      where: { id },
      data: { lastOpenedAt: new Date() },
    });

    return { message: 'Document opened' };
  }

  async duplicate(userId: string, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { content: true }
    });

    if (!document || document.isDeleted) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('You do not have access to this document');

    const duplicated = await this.prisma.document.create({
      data: {
        title: `Copy of ${document.title}`,
        ownerId: userId,
        content: {
          create: {
            content: document.content?.content || { ops: [{ insert: '\n' }] }
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
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('You do not have access to this document');

    await this.prisma.document.update({
      where: { id },
      data: { isDeleted: true },
    });

  async updateContent(userId: string, id: string, dto: UpdateDocumentContentDto) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.isDeleted) throw new NotFoundException('Document not found');
    if (document.ownerId !== userId) throw new ForbiddenException('You do not have access to this document');

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

    return { message: 'Document content saved' };
  }
}
