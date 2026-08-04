export enum CommentStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

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

export interface CommentReplyResponse {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthor;
}

export interface CommentResponse {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selectedText?: string;
  positionData?: PositionData;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthor;
  replies: CommentReplyResponse[];
  reactionCount?: number;
}

export interface CommentListResponse {
  comments: CommentResponse[];
  total: number;
}

export enum CommentEvent {
  COMMENT_CREATED = 'comment-created',
  COMMENT_UPDATED = 'comment-updated',
  COMMENT_DELETED = 'comment-deleted',
  COMMENT_RESOLVED = 'comment-resolved',
  COMMENT_REOPENED = 'comment-reopened',
  REPLY_ADDED = 'reply-added',
  REPLY_DELETED = 'reply-deleted',
}
