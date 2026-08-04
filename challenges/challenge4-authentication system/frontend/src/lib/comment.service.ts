import { api } from './api';

export interface PositionData {
  from?: number;
  to?: number;
  nodePos?: number;
  paragraphId?: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selectedText?: string;
  positionData?: PositionData;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies: CommentReply[];
  reactionCount?: number;
}

export interface CreateCommentDto {
  content: string;
  selectedText?: string;
  positionData?: PositionData;
}

export interface CreateReplyDto {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

export const commentService = {
  /**
   * Get all comments for a document
   */
  async getComments(documentId: string, includeResolved = false): Promise<CommentsResponse> {
    const { data } = await api.get(`/documents/${documentId}/comments`, {
      params: { includeResolved: includeResolved.toString() }
    });
    return data;
  },

  /**
   * Create a new comment
   */
  async createComment(documentId: string, dto: CreateCommentDto): Promise<Comment> {
    const { data } = await api.post(`/documents/${documentId}/comments`, dto);
    return data;
  },

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<Comment> {
    const { data } = await api.get(`/comments/${commentId}`);
    return data;
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const { data } = await api.patch(`/comments/${commentId}`, { content });
    return data;
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },

  /**
   * Resolve a comment
   */
  async resolveComment(commentId: string): Promise<Comment> {
    const { data } = await api.patch(`/comments/${commentId}/resolve`);
    return data;
  },

  /**
   * Reopen a resolved comment
   */
  async reopenComment(commentId: string): Promise<Comment> {
    const { data } = await api.patch(`/comments/${commentId}/reopen`);
    return data;
  },

  /**
   * Add a reply to a comment
   */
  async addReply(commentId: string, dto: CreateReplyDto): Promise<CommentReply> {
    const { data } = await api.post(`/comments/${commentId}/replies`, dto);
    return data;
  },

  /**
   * Delete a reply
   */
  async deleteReply(commentId: string, replyId: string): Promise<void> {
    await api.delete(`/comments/${commentId}/replies/${replyId}`);
  },
};