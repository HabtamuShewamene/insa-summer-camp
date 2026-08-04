'use client';

import { useState } from 'react';
import { CommentItem } from './comment-item';
import { Comment } from '@/lib/comment.service';
import { cn } from '@/lib/utils';

interface CommentThreadProps {
  comments: Comment[];
  documentId: string;
  onHighlightComment?: (commentId: string) => void;
  className?: string;
}

export function CommentThread({ 
  comments, 
  documentId, 
  onHighlightComment,
  className 
}: CommentThreadProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {comments.map((comment, index) => (
        <div key={comment.id} className="relative">
          {/* Thread connector line */}
          {index > 0 && (
            <div className="absolute -top-2 left-4 w-px h-2 bg-border" />
          )}
          
          <CommentItem
            comment={comment}
            documentId={documentId}
            onHighlightClick={() => onHighlightComment?.(comment.id)}
          />
        </div>
      ))}
    </div>
  );
}