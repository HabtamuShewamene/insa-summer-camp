'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentSidebar } from '@/components/comments/CommentSidebar';
import { VersionSidebar } from '@/components/version-history/VersionSidebar';
import { Comment, CommentPositionData } from '@/lib/comments.service';

export function DocumentSidebar({
  documentId,
  documentTitle,
  activeTab,
  onTabChange,
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
  documentId: string;
  documentTitle: string;
  activeTab: 'comments' | 'history';
  onTabChange: (tab: 'comments' | 'history') => void;
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
  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'comments' | 'history')} className="flex h-full flex-col">
        <div className="border-b border-border p-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="comments" className="mt-0 flex-1">
          <CommentSidebar
            documentTitle={documentTitle}
            activeComments={activeComments}
            resolvedComments={resolvedComments}
            selectedText={selectedText}
            selectedRange={selectedRange}
            isComposerOpen={isComposerOpen}
            onOpenComposer={onOpenComposer}
            onCancelComposer={onCancelComposer}
            onCreateComment={onCreateComment}
            onReply={onReply}
            onResolve={onResolve}
            onReopen={onReopen}
            onDelete={onDelete}
            onDeleteReply={onDeleteReply}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-0 flex-1">
          <VersionSidebar documentId={documentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}