'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Comment, CommentReply } from '@/lib/comment.service';
import { useCollaboration } from '@/lib/collaboration-context';

interface CommentSocketEvents {
  'comment-created': {
    comment: Comment;
    documentId: string;
  };
  'comment-updated': {
    comment: Comment;
    documentId: string;
  };
  'comment-deleted': {
    commentId: string;
    documentId: string;
  };
  'comment-resolved': {
    comment: Comment;
    documentId: string;
  };
  'reply-added': {
    reply: CommentReply;
    commentId: string;
    documentId: string;
  };
  'reply-deleted': {
    replyId: string;
    commentId: string;
    documentId: string;
  };
}

export function useCommentSocket(documentId: string) {
  const queryClient = useQueryClient();
  const { socket } = useCollaboration();

  useEffect(() => {
    if (!socket || !documentId) return;

    // Join the document's comment room
    socket.emit('join-document', documentId);

    // Handle comment created
    const handleCommentCreated = (data: CommentSocketEvents['comment-created']) => {
      if (data.documentId !== documentId) return;

      // Update both active and resolved comments caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return { comments: [data.comment], total: 1 };
          
          // Check if comment already exists (prevent duplicates)
          const exists = old.comments.some((c: Comment) => c.id === data.comment.id);
          if (exists) return old;
          
          return {
            comments: [data.comment, ...old.comments],
            total: old.total + 1,
          };
        });
      });
    };

    // Handle comment updated
    const handleCommentUpdated = (data: CommentSocketEvents['comment-updated']) => {
      if (data.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === data.comment.id ? data.comment : comment
            ),
          };
        });
      });
    };

    // Handle comment deleted
    const handleCommentDeleted = (data: CommentSocketEvents['comment-deleted']) => {
      if (data.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.filter((comment: Comment) => comment.id !== data.commentId),
            total: Math.max(0, old.total - 1),
          };
        });
      });
    };

    // Handle comment resolved
    const handleCommentResolved = (data: CommentSocketEvents['comment-resolved']) => {
      if (data.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === data.comment.id ? data.comment : comment
            ),
          };
        });
      });
    };

    // Handle reply added
    const handleReplyAdded = (data: CommentSocketEvents['reply-added']) => {
      if (data.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === data.commentId
                ? {
                    ...comment,
                    replies: [...comment.replies, data.reply],
                  }
                : comment
            ),
          };
        });
      });
    };

    // Handle reply deleted
    const handleReplyDeleted = (data: CommentSocketEvents['reply-deleted']) => {
      if (data.documentId !== documentId) return;

      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === data.commentId
                ? {
                    ...comment,
                    replies: comment.replies.filter((reply) => reply.id !== data.replyId),
                  }
                : comment
            ),
          };
        });
      });
    };

    // Register event listeners
    socket.on('comment-created', handleCommentCreated);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);
    socket.on('comment-resolved', handleCommentResolved);
    socket.on('reply-added', handleReplyAdded);
    socket.on('reply-deleted', handleReplyDeleted);

    return () => {
      // Clean up event listeners
      socket.off('comment-created', handleCommentCreated);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
      socket.off('comment-resolved', handleCommentResolved);
      socket.off('reply-added', handleReplyAdded);
      socket.off('reply-deleted', handleReplyDeleted);
      
      // Leave the document room
      socket.emit('leave-document', documentId);
    };
  }, [socket, documentId, queryClient]);
}