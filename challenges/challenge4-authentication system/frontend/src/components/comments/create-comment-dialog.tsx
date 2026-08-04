'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useCreateComment } from '@/hooks/use-comments';
import { CreateCommentDto } from '@/lib/comment.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateCommentDialogProps {
  documentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText?: string;
  positionData?: CreateCommentDto['positionData'];
  onSuccess?: () => void;
}

export function CreateCommentDialog({
  documentId,
  isOpen,
  onOpenChange,
  selectedText,
  positionData,
  onSuccess,
}: CreateCommentDialogProps) {
  const [content, setContent] = useState('');
  const createCommentMutation = useCreateComment(documentId);

  const handleSubmit = () => {
    if (!content.trim()) return;

    const dto: CreateCommentDto = {
      content: content.trim(),
      selectedText,
      positionData,
    };

    createCommentMutation.mutate(dto, {
      onSuccess: () => {
        setContent('');
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Add a comment to discuss this selection with your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Text Preview */}
          {selectedText && (
            <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
              <p className="text-sm font-medium">"{selectedText}"</p>
            </div>
          )}

          {/* Comment Input */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your comment..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={createCommentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createCommentMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {createCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}