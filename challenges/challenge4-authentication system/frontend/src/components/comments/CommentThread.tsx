'use client';

import { Comment } from '@/lib/comments.service';
import { CommentItem } from './CommentItem';

export function CommentThread(props: {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  return <CommentItem {...props} />;
}