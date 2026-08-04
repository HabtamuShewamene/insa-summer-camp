'use client';

import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentReply as CommentReplyType } from '@/lib/comments.service';

export function CommentReply({
  reply,
  canDelete,
  onDelete,
}: {
  reply: CommentReplyType;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-[10px]">{reply.author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-foreground">{reply.author.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
          </div>
        </div>
        <p className="mt-1 text-sm leading-5 text-foreground/80">{reply.content}</p>
      </div>
      {canDelete && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}