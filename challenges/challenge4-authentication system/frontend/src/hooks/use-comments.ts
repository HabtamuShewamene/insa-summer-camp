'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService, Comment, CommentReply, CreateCommentDto, CreateReplyDto } from '@/lib/comment.service';
import { useCommentSocket } from './use-comment-socket';
import { toast } from 'sonner';

export function useComments(documentId: string, includeResolved = false) {
  // Initialize Socket.IO for real-time updates
  useCommentSocket(documentId);
  
  return useQuery({
    queryKey: ['comments', documentId, includeResolved],
    queryFn: () => commentService.getComments(documentId, includeResolved),
    enabled: !!documentId,
  });
}

export function useCreateComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) => commentService.createComment(documentId, dto),
    onSuccess: (newComment) => {
      // Update the comments cache
      queryClient.setQueryData(['comments', documentId, false], (old: any) => {
        if (!old) return { comments: [newComment], total: 1 };
        return {
          comments: [newComment, ...old.comments],
          total: old.total + 1,
        };
      });
      
      // Also update includeResolved cache if it exists
      queryClient.setQueryData(['comments', documentId, true], (old: any) => {
        if (!old) return { comments: [newComment], total: 1 };
        return {
          comments: [newComment, ...old.comments],
          total: old.total + 1,
        };
      });

      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create comment');
    },
  });
}

export function useAddReply(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, dto }: { commentId: string; dto: CreateReplyDto }) => 
      commentService.addReply(commentId, dto),
    onSuccess: (newReply, { commentId }) => {
      // Update both active and resolved comments caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === commentId
                ? { ...comment, replies: [...comment.replies, newReply] }
                : comment
            ),
          };
        });
      });

      toast.success('Reply added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    },
  });
}

export function useResolveComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.resolveComment(commentId),
    onSuccess: (updatedComment) => {
      // Update both caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === updatedComment.id ? updatedComment : comment
            ),
          };
        });
      });

      toast.success('Comment resolved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve comment');
    },
  });
}

export function useReopenComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.reopenComment(commentId),
    onSuccess: (updatedComment) => {
      // Update both caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === updatedComment.id ? updatedComment : comment
            ),
          };
        });
      });

      toast.success('Comment reopened');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reopen comment');
    },
  });
}

export function useDeleteComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      // Update both caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.filter((comment: Comment) => comment.id !== commentId),
            total: old.total - 1,
          };
        });
      });

      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    },
  });
}

export function useDeleteReply(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, replyId }: { commentId: string; replyId: string }) => 
      commentService.deleteReply(commentId, replyId),
    onSuccess: (_, { commentId, replyId }) => {
      // Update both caches
      [false, true].forEach((includeResolved) => {
        queryClient.setQueryData(['comments', documentId, includeResolved], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            comments: old.comments.map((comment: Comment) =>
              comment.id === commentId
                ? { ...comment, replies: comment.replies.filter((reply) => reply.id !== replyId) }
                : comment
            ),
          };
        });
      });

      toast.success('Reply deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete reply');
    },
  });
}

// Convenience hooks with simplified APIs
export function useReplyToComment(documentId: string) {
  const addReplyMutation = useAddReply(documentId);
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      addReplyMutation.mutateAsync({ commentId, dto: { content } }),
  });
}