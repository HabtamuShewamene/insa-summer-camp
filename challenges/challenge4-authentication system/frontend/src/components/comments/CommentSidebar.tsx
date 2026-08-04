'use client';

import { useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommentBadge } from './CommentBadge';
import { CreateComment } from './CreateComment';
import { CommentThread } from './CommentThread';
import { Comment, CommentPositionData } from '@/lib/comments.service';
import { useAuth } from '@/lib/auth-context';

export function CommentSidebar({
  documentTitle,
  activeComments,
  resolvedComments,
  selectedText,
  selectedRange,
  isComposerOpen,
  onOpenComposer,
  onCancelComposer,
  onCreateComment,
  onReply,
  onResolve,
  onReopen,
  onDelete,
  onDeleteReply,
}: {
  documentTitle: string;
  activeComments: Comment[];
  resolvedComments: Comment[];
  selectedText: string | null;
  selectedRange: CommentPositionData | null;
  isComposerOpen: boolean;
  onOpenComposer: () => void;
  onCancelComposer: () => void;
  onCreateComment: (content: string) => Promise<void>;
  onReply: (commentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const selectedPreview = useMemo(() => selectedText?.trim() || '', [selectedText]);

  const handleCreateComment = async (content: string) => {
    setIsCreating(true);
    try {
      await onCreateComment(content);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Comments</div>
            <div className="mt-1 text-sm font-medium text-foreground">{documentTitle}</div>
          </div>
          <CommentBadge count={activeComments.length} />
        </div>
      </div>

      <div className="border-b border-border p-4">
        {selectedPreview && isComposerOpen ? (
          <CreateComment
            selectedText={selectedPreview}
            onSubmit={handleCreateComment}
            onCancel={onCancelComposer}
            isSubmitting={isCreating}
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            <div>{selectedPreview ? 'Click Add Comment to start a discussion.' : 'Select text to start a discussion.'}</div>
            {selectedPreview && (
              <button type="button" onClick={onOpenComposer} className="text-sm font-medium text-foreground underline underline-offset-4">
                Add Comment
              </button>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {activeComments.length === 0 && resolvedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
              <MessageSquareText className="mb-3 h-5 w-5" />
              <div className="font-medium text-foreground">No comments yet</div>
              <div className="mt-1">Select text to start a discussion.</div>
            </div>
          ) : null}

          {activeComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={onReply}
              onResolve={onResolve}
              onReopen={onReopen}
              onDelete={onDelete}
              onDeleteReply={onDeleteReply}
            />
          ))}

          {resolvedComments.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Resolved</div>
              {resolvedComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onReply={onReply}
                  onResolve={onResolve}
                  onReopen={onReopen}
                  onDelete={onDelete}
                  onDeleteReply={onDeleteReply}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}