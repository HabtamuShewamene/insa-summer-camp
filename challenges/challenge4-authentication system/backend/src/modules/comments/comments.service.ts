import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentResponse,
  CommentReplyResponse,
  CommentListResponse,
  CommentAuthor,
  CommentStatus,
} from './types/comment.types';

@Injectable()
export class CommentsService {
  private socketServer: any;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Set socket server instance (injected after module initialization to avoid circular dependency)
   */
  setSocketServer(socketServer: any): void {
    this.socketServer = socketServer;
  }

  /**
   * Create a new comment on a document
   */
  async createComment(
    documentId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    // Verify document exists and is not deleted
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.isDeleted) {
      throw new NotFoundException('Document not found');
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        documentId,
        userId,
        content: dto.content,
        selectedText: dto.selectedText,
        positionData: dto.positionData,
        status: CommentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    const response = this.mapCommentToResponse(comment);

    // Broadcast to Socket.IO room
    if (this.socketServer) {
      this.socketServer.broadcastCommentCreated(documentId, response);
    }

    return response;
  }

  /**
   * Get all comments for a document
   */
  async getDocumentComments(
    documentId: string,
    includeResolved: boolean = false,
  ): Promise<CommentListResponse> {
    const whereClause: any = { documentId };
    
    if (!includeResolved) {
      whereClause.status = CommentStatus.ACTIVE;
    }

    const comments = await this.prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
        reactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      comments: comments.map((comment) => this.mapCommentToResponse(comment)),
      total: comments.length,
    };
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
        reactions: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.mapCommentToResponse(comment);
  }

  /**
   * Update a comment (only by owner)
   */
  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    return this.mapCommentToResponse(updated);
  }

  /**
   * Delete a comment (only by owner)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const documentId = comment.documentId;

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Broadcast to Socket.IO room
    if (this.socketServer) {
      this.socketServer.broadcastCommentDeleted(documentId, commentId);
    }
  }

  /**
   * Resolve a comment
   */
  async resolveComment(commentId: string, userId: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only document owner or comment author can resolve
    if (comment.document.ownerId !== userId && comment.userId !== userId) {
      throw new ForbiddenException('You cannot resolve this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.RESOLVED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    const response = this.mapCommentToResponse(updated);

    // Broadcast to Socket.IO room
    if (this.socketServer) {
      this.socketServer.broadcastCommentResolved(comment.documentId, response);
    }

    return response;
  }

  /**
   * Reopen a resolved comment
   */
  async reopenComment(commentId: string, userId: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.status !== CommentStatus.RESOLVED) {
      throw new BadRequestException('Comment is not resolved');
    }

    // Only document owner or comment author can reopen
    if (comment.document.ownerId !== userId && comment.userId !== userId) {
      throw new ForbiddenException('You cannot reopen this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    return this.mapCommentToResponse(updated);
  }

  /**
   * Add a reply to a comment
   */
  async addReply(
    commentId: string,
    userId: string,
    dto: CreateReplyDto,
  ): Promise<CommentReplyResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const reply = await this.prisma.commentReply.create({
      data: {
        commentId,
        userId,
        content: dto.content,
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

    const response = this.mapReplyToResponse(reply);

    // Broadcast to Socket.IO room
    if (this.socketServer) {
      this.socketServer.broadcastReplyAdded(comment.documentId, {
        ...response,
        commentId: comment.id,
      });
    }

    return response;
  }

  /**
   * Delete a reply (only by owner)
   */
  async deleteReply(replyId: string, userId: string): Promise<void> {
    const reply = await this.prisma.commentReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.userId !== userId) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.commentReply.delete({
      where: { id: replyId },
    });
  }

  /**
   * Map database comment to response format
   */
  private mapCommentToResponse(comment: any): CommentResponse {
    return {
      id: comment.id,
      documentId: comment.documentId,
      userId: comment.userId,
      content: comment.content,
      selectedText: comment.selectedText,
      positionData: comment.positionData,
      status: comment.status,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.user.id,
        name: comment.user.name,
        email: comment.user.email,
      },
      replies: comment.replies
        ? comment.replies.map((reply: any) => this.mapReplyToResponse(reply))
        : [],
      reactionCount: comment.reactions ? comment.reactions.length : 0,
    };
  }

  /**
   * Map database reply to response format
   */
  private mapReplyToResponse(reply: any): CommentReplyResponse {
    return {
      id: reply.id,
      commentId: reply.commentId,
      userId: reply.userId,
      content: reply.content,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      author: {
        id: reply.user.id,
        name: reply.user.name,
        email: reply.user.email,
      },
    };
  }

  /**
   * Verify user has access to document
   */
  async verifyDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.isDeleted) {
      return false;
    }

    // For now, only document owner has access
    // TODO: Implement proper permission system with viewers/editors
    return document.ownerId === userId;
  }
}
