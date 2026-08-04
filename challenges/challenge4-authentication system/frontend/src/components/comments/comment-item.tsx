'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, MessageSquare, Trash2, RotateCcw } from 'lucide-react';
import { Comment } from '@/lib/comment.service';
import { CommentReplyComponent, ReplyInput } from './comment-reply';
import { useAuth } from '@/lib/auth-context';
import { useResolveComment, useReopenComment, useDeleteComment } from '@/hooks/use-comments';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CommentItemProps {
  comment: Comment;
  documentId: string;
  onHighlightClick?: () => void;
}

export function CommentItem({ comment, documentId, onHighlightClick }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  
  const resolveCommentMutation = useResolveComment(documentId);
  const reopenCommentMutation = useReopenComment(documentId);
  const deleteCommentMutation = useDeleteComment(documentId);
  
  const isOwner = user?.id === comment.userId;
  const isResolved = comment.status === 'RESOLVED';
  
  const handleResolve = () => {
    if (isResolved) {
      reopenCommentMutation.mutate(comment.id);
    } else {
      resolveCommentMutation.mutate(comment.id);
    }
  };
  
  const handleDelete = () => {
    deleteCommentMutation.mutate(comment.id);
  };
  
  return (
    <div
      className={cn(
        'p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors',
        isResolved && 'opacity-75'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-sm bg-muted">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {comment.author.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {isResolved && (
              <Badge variant="secondary" className="text-xs">
                Resolved
              </Badge>
            )}
          </div>
          
          {/* Selected Text Preview */}
          {comment.selectedText && (
            <div
              className="mb-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-primary/20 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={onHighlightClick}
            >
              "{comment.selectedText}"
            </div>
          )}
          
          {/* Comment Content */}
          <div className="text-sm text-foreground leading-relaxed mb-3">
            {comment.content}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="h-7 px-3 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-2" />
            Reply
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolve}
            disabled={resolveCommentMutation.isPending || reopenCommentMutation.isPending}
            className="h-7 px-3 text-xs"
          >
            {isResolved ? (
              <>
                <RotateCcw className="h-3 w-3 mr-2" />
                Reopen
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-2" />
                Resolve
              </>
            )}
          </Button>
          
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The comment and all replies will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {comment.replies.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>
      
      {/* Reply Input */}
      {showReplyInput && (
        <ReplyInput
          commentId={comment.id}
          documentId={documentId}
          onCancel={() => setShowReplyInput(false)}
        />
      )}
      
      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentReplyComponent
              key={reply.id}
              reply={reply}
              commentId={comment.id}
              documentId={documentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}