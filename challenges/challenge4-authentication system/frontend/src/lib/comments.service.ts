'use client';

import { apiClient } from './api';

export type CommentStatus = 'ACTIVE' | 'RESOLVED';

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

export interface CommentPositionData {
  from?: number;
  to?: number;
  nodePos?: number;
  paragraphId?: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selectedText?: string | null;
  positionData?: CommentPositionData | null;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies: CommentReply[];
  reactionCount?: number;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
}

export interface CreateCommentPayload {
  content: string;
  selectedText?: string;
  positionData?: CommentPositionData;
}

export interface CreateReplyPayload {
  content: string;
}

export const commentsService = {
  async getDocumentComments(documentId: string, includeResolved = true): Promise<CommentListResponse> {
    const { data } = await apiClient.get<CommentListResponse>(`/documents/${documentId}/comments`, {
      params: { includeResolved: includeResolved ? 'true' : 'false' },
    });

    return data;
  },

  async createComment(documentId: string, payload: CreateCommentPayload): Promise<Comment> {
    const { data } = await apiClient.post<Comment>(`/documents/${documentId}/comments`, payload);
    return data;
  },

  async createReply(commentId: string, payload: CreateReplyPayload): Promise<CommentReply> {
    const { data } = await apiClient.post<CommentReply>(`/comments/${commentId}/replies`, payload);
    return data;
  },

  async resolveComment(commentId: string): Promise<Comment> {
    const { data } = await apiClient.patch<Comment>(`/comments/${commentId}/resolve`);
    return data;
  },

  async reopenComment(commentId: string): Promise<Comment> {
    const { data } = await apiClient.patch<Comment>(`/comments/${commentId}/reopen`);
    return data;
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/comments/${commentId}`);
    return data;
  },

  async deleteReply(commentId: string, replyId: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/comments/${commentId}/replies/${replyId}`);
    return data;
  },
};