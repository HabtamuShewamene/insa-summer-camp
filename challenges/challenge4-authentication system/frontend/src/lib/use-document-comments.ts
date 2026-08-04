'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth-context';
import {
  Comment,
  CommentReply,
  commentsService,
  CreateCommentPayload,
  CreateReplyPayload,
} from './comments.service';

interface UseDocumentCommentsResult {
  comments: Comment[];
  activeComments: Comment[];
  resolvedComments: Comment[];
  isLoading: boolean;
  error: string | null;
  createComment: (payload: CreateCommentPayload) => Promise<Comment | null>;
  replyToComment: (commentId: string, payload: CreateReplyPayload) => Promise<CommentReply | null>;
  resolveComment: (commentId: string) => Promise<Comment | null>;
  reopenComment: (commentId: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  deleteReply: (commentId: string, replyId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export function useDocumentComments(documentId: string): UseDocumentCommentsResult {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshComments = useCallback(async () => {
    if (!documentId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await commentsService.getDocumentComments(documentId, true);
      setComments(response.comments);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void refreshComments();
  }, [refreshComments]);

  useEffect(() => {
    const onCreated = (event: Event) => {
      const detail = (event as CustomEvent<Comment>).detail;
      if (!detail || detail.documentId !== documentId) {
        return;
      }

      setComments((current) => {
        const withoutExisting = current.filter((comment) => comment.id !== detail.id);
        return [detail, ...withoutExisting];
      });
    };

    const onResolved = (event: Event) => {
      const detail = (event as CustomEvent<Comment>).detail;
      if (!detail) {
        return;
      }

      setComments((current) => current.map((comment) => (comment.id === detail.id ? detail : comment)));
    };

    const onReopened = (event: Event) => {
      const detail = (event as CustomEvent<Comment>).detail;
      if (!detail) {
        return;
      }

      setComments((current) => current.map((comment) => (comment.id === detail.id ? detail : comment)));
    };

    const onDeleted = (event: Event) => {
      const detail = (event as CustomEvent<{ commentId: string }>).detail;
      if (!detail) {
        return;
      }

      setComments((current) => current.filter((comment) => comment.id !== detail.commentId));
    };

    const onReplied = (event: Event) => {
      const detail = (event as CustomEvent<CommentReply & { commentId: string }>).detail;
      if (!detail) {
        return;
      }

      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== detail.commentId) {
            return comment;
          }

          const replies = comment.replies.some((reply) => reply.id === detail.id)
            ? comment.replies
            : [...comment.replies, detail];

          return { ...comment, replies };
        }),
      );
    };

    const onReplyDeleted = (event: Event) => {
      const detail = (event as CustomEvent<{ commentId: string; replyId: string }>).detail;
      if (!detail) {
        return;
      }

      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== detail.commentId) {
            return comment;
          }

          return {
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== detail.replyId),
          };
        }),
      );
    };

    window.addEventListener('comment-created', onCreated as EventListener);
    window.addEventListener('comment-resolved', onResolved as EventListener);
    window.addEventListener('comment-reopened', onReopened as EventListener);
    window.addEventListener('comment-deleted', onDeleted as EventListener);
    window.addEventListener('comment-replied', onReplied as EventListener);
    window.addEventListener('comment-reply-deleted', onReplyDeleted as EventListener);

    return () => {
      window.removeEventListener('comment-created', onCreated as EventListener);
      window.removeEventListener('comment-resolved', onResolved as EventListener);
      window.removeEventListener('comment-reopened', onReopened as EventListener);
      window.removeEventListener('comment-deleted', onDeleted as EventListener);
      window.removeEventListener('comment-replied', onReplied as EventListener);
      window.removeEventListener('comment-reply-deleted', onReplyDeleted as EventListener);
    };
  }, [documentId]);

  const activeComments = useMemo(() => comments.filter((comment) => comment.status === 'ACTIVE'), [comments]);
  const resolvedComments = useMemo(() => comments.filter((comment) => comment.status === 'RESOLVED'), [comments]);

  const createComment = useCallback(
    async (payload: CreateCommentPayload) => {
      try {
        const created = await commentsService.createComment(documentId, payload);
        setComments((current) => [created, ...current.filter((comment) => comment.id !== created.id)]);
        return created;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to create comment');
        return null;
      }
    },
    [documentId],
  );

  const replyToComment = useCallback(
    async (commentId: string, payload: CreateReplyPayload) => {
      try {
        const reply = await commentsService.createReply(commentId, payload);
        setComments((current) =>
          current.map((comment) => {
            if (comment.id !== commentId) {
              return comment;
            }

            const nextReplies = comment.replies.some((existingReply) => existingReply.id === reply.id)
              ? comment.replies
              : [...comment.replies, reply];

            return { ...comment, replies: nextReplies };
          }),
        );
        return reply;
      } catch (replyError) {
        setError(replyError instanceof Error ? replyError.message : 'Failed to reply to comment');
        return null;
      }
    },
    [],
  );

  const resolveComment = useCallback(async (commentId: string) => {
    try {
      const resolved = await commentsService.resolveComment(commentId);
      setComments((current) => current.map((comment) => (comment.id === commentId ? resolved : comment)));
      return resolved;
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : 'Failed to resolve comment');
      return null;
    }
  }, []);

  const reopenComment = useCallback(async (commentId: string) => {
    try {
      const reopened = await commentsService.reopenComment(commentId);
      setComments((current) => current.map((comment) => (comment.id === commentId ? reopened : comment)));
      return reopened;
    } catch (reopenError) {
      setError(reopenError instanceof Error ? reopenError.message : 'Failed to reopen comment');
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    await commentsService.deleteComment(commentId);
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  }, []);

  const deleteReply = useCallback(async (commentId: string, replyId: string) => {
    await commentsService.deleteReply(commentId, replyId);
    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        return {
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== replyId),
        };
      }),
    );
  }, []);

  return {
    comments,
    activeComments,
    resolvedComments,
    isLoading,
    error,
    createComment,
    replyToComment,
    resolveComment,
    reopenComment,
    deleteComment,
    deleteReply,
    refreshComments,
  };
}