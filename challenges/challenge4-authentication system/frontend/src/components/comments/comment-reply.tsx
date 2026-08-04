'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Send } from 'lucide-react';
import { CommentReply } from '@/lib/comment.service';
import { useAuth } from '@/lib/auth-context';
import { useAddReply, useDeleteReply } from '@/hooks/use-comments';
import { formatDistanceToNow } from 'date-fns';
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

interface CommentReplyProps {
  reply: CommentReply;
  commentId: string;
  documentId: string;
}

export function CommentReplyComponent({ reply, commentId, documentId }: CommentReplyProps) {
  const { user } = useAuth();
  const deleteReplyMutation = useDeleteReply(documentId);
  
  const isOwner = user?.id === reply.userId;
  
  const handleDelete = () => {
    deleteReplyMutation.mutate({ commentId, replyId: reply.id });
  };
  
  return (
    <div className="flex gap-3 pl-4 border-l-2 border-muted">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarFallback className="text-xs bg-muted">
          {reply.author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-foreground">
            {reply.author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <div className="text-sm text-foreground leading-relaxed mb-2">
          {reply.content}
        </div>
        
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete reply?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The reply will be permanently deleted.
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
    </div>
  );
}

interface ReplyInputProps {
  commentId: string;
  documentId: string;
  onCancel?: () => void;
}

export function ReplyInput({ commentId, documentId, onCancel }: ReplyInputProps) {
  const [content, setContent] = useState('');
  const addReplyMutation = useAddReply(documentId);
  
  const handleSubmit = () => {
    if (!content.trim()) return;
    
    addReplyMutation.mutate(
      { commentId, dto: { content: content.trim() } },
      {
        onSuccess: () => {
          setContent('');
          onCancel?.();
        },
      }
    );
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };
  
  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply..."
        className="min-h-[60px] text-sm resize-none"
        autoFocus
      />
      
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={addReplyMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || addReplyMutation.isPending}
        >
          <Send className="h-3 w-3 mr-2" />
          Reply
        </Button>
      </div>
    </div>
  );
}