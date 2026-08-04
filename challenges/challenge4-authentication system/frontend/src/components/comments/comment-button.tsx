'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { CreateCommentDialog } from './create-comment-dialog';
import { PositionData } from '@/lib/comment.service';
import { cn } from '@/lib/utils';

interface CommentButtonProps {
  documentId: string;
  selectedText?: string;
  positionData?: PositionData;
  position?: { top: number; left: number };
  onCommentCreated?: () => void;
  className?: string;
}

export function CommentButton({
  documentId,
  selectedText,
  positionData,
  position,
  onCommentCreated,
  className,
}: CommentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show button when there's selected text
    setIsVisible(!!selectedText);
  }, [selectedText]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className={cn(
          'fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        style={{
          top: position?.top ?? 0,
          left: position?.left ?? 0,
        }}
      >
        <div className="bg-background border border-border rounded-lg shadow-lg p-1">
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-8 px-3 text-xs gap-2"
          >
            <MessageSquare className="h-3 w-3" />
            Comment
          </Button>
        </div>
      </div>

      <CreateCommentDialog
        documentId={documentId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedText={selectedText}
        positionData={positionData}
        onSuccess={() => {
          onCommentCreated?.();
          setIsVisible(false);
        }}
      />
    </>
  );
}

// Floating comment toolbar that appears on text selection
interface FloatingCommentToolbarProps {
  documentId: string;
  isVisible: boolean;
  selectedText?: string;
  positionData?: PositionData;
  position?: { top: number; left: number };
  onCommentCreated?: () => void;
  onClose?: () => void;
}

export function FloatingCommentToolbar({
  documentId,
  isVisible,
  selectedText,
  positionData,
  position,
  onCommentCreated,
  onClose,
}: FloatingCommentToolbarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200"
        style={{
          top: (position?.top ?? 0) - 50,
          left: position?.left ?? 0,
        }}
      >
        <div className="bg-background border border-border rounded-lg shadow-lg p-1 flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-8 px-3 text-xs gap-2"
          >
            <MessageSquare className="h-3 w-3" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </div>
      </div>

      <CreateCommentDialog
        documentId={documentId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedText={selectedText}
        positionData={positionData}
        onSuccess={() => {
          onCommentCreated?.();
          onClose?.();
        }}
      />
    </>
  );
}