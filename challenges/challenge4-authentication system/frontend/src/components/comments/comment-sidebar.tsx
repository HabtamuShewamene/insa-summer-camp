'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Filter, Eye, EyeOff } from 'lucide-react';
import { CommentItem } from './comment-item';
import { EmptyComments } from './empty-comments';
import { useComments } from '@/hooks/use-comments';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentSidebarProps {
  documentId: string;
  isOpen: boolean;
  onToggle: () => void;
  onHighlightComment?: (commentId: string) => void;
  className?: string;
}

export function CommentSidebar({ 
  documentId, 
  isOpen, 
  onToggle, 
  onHighlightComment,
  className 
}: CommentSidebarProps) {
  const [showResolved, setShowResolved] = useState(false);
  
  const { 
    data: commentsData, 
    isLoading, 
    error 
  } = useComments(documentId, showResolved);
  
  const comments = commentsData?.comments || [];
  const activeComments = comments.filter(comment => comment.status === 'ACTIVE');
  const resolvedComments = comments.filter(comment => comment.status === 'RESOLVED');
  
  if (!isOpen) {
    return (
      <div className={cn('w-12 border-l border-border bg-background', className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full h-8"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-80 border-l border-border bg-background flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h2 className="font-medium text-sm">Comments</h2>
            {activeComments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeComments.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowResolved(false)}
                  className={cn('text-xs', !showResolved && 'bg-muted')}
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Active only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowResolved(true)}
                  className={cn('text-xs', showResolved && 'bg-muted')}
                >
                  <EyeOff className="h-3 w-3 mr-2" />
                  All comments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 w-7 p-0"
            >
              ×
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{activeComments.length} active</span>
          {resolvedComments.length > 0 && (
            <span>{resolvedComments.length} resolved</span>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Failed to load comments
              </p>
            </div>
          ) : comments.length === 0 ? (
            <EmptyComments />
          ) : (
            <div className="space-y-4">
              {/* Active Comments */}
              {activeComments.length > 0 && (
                <div className="space-y-3">
                  {activeComments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      documentId={documentId}
                      onHighlightClick={() => onHighlightComment?.(comment.id)}
                    />
                  ))}
                </div>
              )}
              
              {/* Resolved Comments */}
              {showResolved && resolvedComments.length > 0 && (
                <>
                  {activeComments.length > 0 && (
                    <div className="py-2">
                      <Separator />
                      <div className="mt-4 mb-2">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Resolved
                        </h3>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {resolvedComments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        documentId={documentId}
                        onHighlightClick={() => onHighlightComment?.(comment.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Select text to add a comment
        </p>
      </div>
    </div>
  );
}