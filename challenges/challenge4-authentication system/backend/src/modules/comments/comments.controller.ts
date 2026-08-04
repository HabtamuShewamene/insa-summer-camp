import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('documents/:documentId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * POST /api/documents/:documentId/comments
   * Create a new comment
   */
  @Post()
  async createComment(
    @Param('documentId') documentId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;

    // Verify user has access to document
    const hasAccess = await this.commentsService.verifyDocumentAccess(documentId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return this.commentsService.createComment(documentId, userId, dto);
  }

  /**
   * GET /api/documents/:documentId/comments
   * Get all comments for a document
   */
  @Get()
  async getComments(
    @Param('documentId') documentId: string,
    @Query('includeResolved') includeResolved: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;

    // Verify user has access to document
    const hasAccess = await this.commentsService.verifyDocumentAccess(documentId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const showResolved = includeResolved === 'true';
    return this.commentsService.getDocumentComments(documentId, showResolved);
  }
}

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentActionsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * GET /api/comments/:id
   * Get a single comment
   */
  @Get(':id')
  async getComment(@Param('id') id: string) {
    return this.commentsService.getCommentById(id);
  }

  /**
   * PATCH /api/comments/:id
   * Update a comment
   */
  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: any,
  ) {
    return this.commentsService.updateComment(id, req.user.id, dto);
  }

  /**
   * DELETE /api/comments/:id
   * Delete a comment
   */
  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Request() req: any) {
    await this.commentsService.deleteComment(id, req.user.id);
    return { message: 'Comment deleted successfully' };
  }

  /**
   * PATCH /api/comments/:id/resolve
   * Resolve a comment
   */
  @Patch(':id/resolve')
  async resolveComment(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.resolveComment(id, req.user.id);
  }

  /**
   * PATCH /api/comments/:id/reopen
   * Reopen a resolved comment
   */
  @Patch(':id/reopen')
  async reopenComment(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.reopenComment(id, req.user.id);
  }

  /**
   * POST /api/comments/:id/replies
   * Add a reply to a comment
   */
  @Post(':id/replies')
  async addReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @Request() req: any,
  ) {
    return this.commentsService.addReply(id, req.user.id, dto);
  }

  /**
   * DELETE /api/comments/:commentId/replies/:replyId
   * Delete a reply
   */
  @Delete(':commentId/replies/:replyId')
  async deleteReply(
    @Param('replyId') replyId: string,
    @Request() req: any,
  ) {
    await this.commentsService.deleteReply(replyId, req.user.id);
    return { message: 'Reply deleted successfully' };
  }
}
