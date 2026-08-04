'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Comment } from '@/lib/comments.service';
import { ResolveButton } from './ResolveButton';
import { CommentReply } from './CommentReply';

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onReopen,
  onDelete,
  onDeleteReply,
}: {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOwner = currentUserId === comment.userId;

  const submitReply = async () => {
    if (!replyContent.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-[10px]">{comment.author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">{comment.author.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ResolveButton
                isResolved={comment.status === 'RESOLVED'}
                onClick={() => (comment.status === 'RESOLVED' ? onReopen(comment.id) : onResolve(comment.id))}
              />
              {isOwner && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(comment.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-foreground/90">{comment.content}</p>

          {comment.selectedText && (
            <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
              “{comment.selectedText}”
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {comment.replies.map((reply) => (
          <CommentReply
            key={reply.id}
            reply={reply}
            canDelete={reply.userId === currentUserId}
            onDelete={() => onDeleteReply(comment.id, reply.id)}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <textarea
          value={replyContent}
          onChange={(event) => setReplyContent(event.target.value)}
          placeholder="Reply to this thread..."
          className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
        />
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={submitReply} disabled={isSubmitting || !replyContent.trim()}>
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}