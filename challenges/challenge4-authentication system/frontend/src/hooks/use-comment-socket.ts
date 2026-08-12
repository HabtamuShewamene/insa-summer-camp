'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Comment, CommentReply } from '@/lib/comment.service';
import { useCollaboration } from '@/lib/collaboration-context';

interface CommentSocketEvents {
  'comment-created': Comment;
  'comment-updated': Comment;
  'comment-deleted': { commentId: string };
  'comment-resolved': Comment;
  'comment-reopened': Comment;
  'reply-added': CommentReply;
  'reply-deleted': { replyId: string; commentId: string };
}

export function useCommentSocket(documentId: string) {
  const queryClient = useQueryClient();
  const { socket } = useCollaboration();

  useEffect(() => {
    if (!socket || !documentId) return;

    // Join the document's comment room
    socket.emit('join-document', { documentId });

    // Handle comment created
    const handleCommentCreated = (comment: CommentSocketEvents['comment-created']) => {
      if (comment.documentId !== documentId) return;

      // Update both active and resolved comments caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return { comments: [comment], total: 1 };
          
          // Check if comment already exists (prevent duplicates)
          const exists = old.comments.some((c: Comment) => c.id === comment.id);
          if (exists) return old;
          
          return {
            comments: [comment, ...old.comments],
            total: old.total + 1,
          };
        });
      });
    };

    // Handle comment updated
    const handleCommentUpdated = (comment: CommentSocketEvents['comment-updated']) => {
      if (comment.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((c: Comment) =>
              c.id === comment.id ? comment : c
            ),
          };
        });
      });
    };

    // Handle comment deleted
    const handleCommentDeleted = (data: CommentSocketEvents['comment-deleted']) => {
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.filter((c: Comment) => c.id !== data.commentId),
            total: Math.max(0, old.total - 1),
          };
        });
      });
    };

    // Handle comment resolved / reopened
    const handleCommentStatusChanged = (comment: Comment) => {
      if (comment.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((c: Comment) =>
              c.id === comment.id ? comment : c
            ),
          };
        });
      });
    };

    // Handle reply added
    const handleReplyAdded = (reply: CommentSocketEvents['reply-added']) => {
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((c: Comment) =>
              c.id === reply.commentId
                ? {
                    ...c,
                    replies: [...c.replies, reply],
                  }
                : c
            ),
          };
        });
      });
    };

    // Handle reply deleted
    const handleReplyDeleted = (data: CommentSocketEvents['reply-deleted']) => {
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((c: Comment) =>
              c.id === data.commentId
                ? {
                    ...c,
                    replies: c.replies.filter((r) => r.id !== data.replyId),
                  }
                : c
            ),
          };
        });
      });
    };

    // Register event listeners
    socket.on('comment-created', handleCommentCreated);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);
    socket.on('comment-resolved', handleCommentStatusChanged);
    socket.on('comment-reopened', handleCommentStatusChanged);
    socket.on('reply-added', handleReplyAdded);
    socket.on('reply-deleted', handleReplyDeleted);

    return () => {
      // Clean up event listeners
      socket.off('comment-created', handleCommentCreated);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
      socket.off('comment-resolved', handleCommentStatusChanged);
      socket.off('comment-reopened', handleCommentStatusChanged);
      socket.off('reply-added', handleReplyAdded);
      socket.off('reply-deleted', handleReplyDeleted);
      
      // Leave the document room
      socket.emit('leave-document', { documentId });
    };
  }, [socket, documentId, queryClient]);
}