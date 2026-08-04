'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { EditorToolbar } from './editor-toolbar';
import { Document, documentService } from '@/lib/document.service';
import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useDocumentCollaboration } from '@/lib/use-document-collaboration';
import { useCollaboration } from '@/lib/collaboration-context';
import { usePresenceTracking } from '@/lib/use-presence-tracking';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { CommentPositionData } from '@/lib/comments.service';
import { useDocumentComments } from '@/lib/use-document-comments';
import { CommentSidebar } from '@/components/comments/CommentSidebar';

export function RichTextEditor({ document }: { document: Document }) {
  const { user } = useAuth();
  const { status } = useCollaboration();
  const { ydoc, provider, isSynced, isCollaborating } = useDocumentCollaboration({
    documentId: document.id,
    enabled: true,
    onSynced: () => {
      console.log('[RichTextEditor] Document synced');
    },
    onError: (error) => {
      console.error('[RichTextEditor] Collaboration error:', error);
    },
  });

  // Emit status updates for UI components
  useEffect(() => {
    const statusMap = {
      connecting: 'Connecting...',
      connected: isSynced ? 'Connected' : 'Syncing...',
      reconnecting: 'Reconnecting...',
      disconnected: 'Offline',
      offline: 'Offline',
      error: 'Sync Failed',
    };
    
    window.dispatchEvent(
      new CustomEvent('collab-status', { 
        detail: statusMap[status] 
      })
    );
  }, [status, isSynced]);

  if (!ydoc || !provider || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <EditorInstance document={document} provider={provider} ydoc={ydoc} user={user} />;
}

function EditorInstance({ document, provider, ydoc, user }: any) {
  const { activeComments, resolvedComments, createComment, replyToComment, resolveComment, reopenComment, deleteComment, deleteReply } = useDocumentComments(document.id);
  // Activity tracking
  usePresenceTracking({
    documentId: document.id,
    enabled: true,
  });

  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<CommentPositionData | null>(null);
  const [isCommentDraftOpen, setIsCommentDraftOpen] = useState(false);

  const debouncedSave = useRef(
    debounce(async (jsonContent: any) => {
      try {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saving' }));
        await documentService.updateContent(document.id, jsonContent);
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saved' }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'error' }));
      }
    }, 2000)
  ).current;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      Typography,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider.awareness,
        user: {
          name: user.name,
          color: provider.awareness.getLocalState()?.user?.color || '#000000',
        },
      }),
    ],
    content: document.content?.content || '',
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[500px] px-8 py-8',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      debouncedSave(json);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setSelectedText(null);
        setSelectedRange(null);
        setIsCommentDraftOpen(false);
        return;
      }

      setSelectedText(editor.state.doc.textBetween(from, to, ' '));
      setSelectedRange({ from, to });
    },
  });

  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  if (!editor) return null;

  const handleAddComment = async () => {
    if (!selectedText || !selectedRange) {
      return;
    }

    editor.chain().focus().setTextSelection(selectedRange).run();
    setIsCommentDraftOpen(true);
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col relative">
        <EditorToolbar editor={editor} onAddComment={handleAddComment} />
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto w-full">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      <div className="hidden w-[380px] shrink-0 xl:block">
        <CommentSidebar
          documentTitle={document.title}
          activeComments={activeComments}
          resolvedComments={resolvedComments}
          selectedText={selectedText}
          selectedRange={selectedRange}
          isComposerOpen={isCommentDraftOpen}
          onOpenComposer={() => setIsCommentDraftOpen(true)}
          onCancelComposer={() => setIsCommentDraftOpen(false)}
          onCreateComment={async (content) => {
            if (!selectedText || !selectedRange) {
              return;
            }

            editor.chain().focus().setTextSelection(selectedRange).setHighlight({ color: 'rgba(0, 0, 0, 0.08)' }).run();
            await createComment({ content, selectedText, positionData: selectedRange });
            setIsCommentDraftOpen(false);
          }}
          onReply={async (commentId, content) => {
            await replyToComment(commentId, { content });
          }}
          onResolve={async (commentId) => {
            await resolveComment(commentId);
          }}
          onReopen={async (commentId) => {
            await reopenComment(commentId);
          }}
          onDelete={async (commentId) => {
            await deleteComment(commentId);
          }}
          onDeleteReply={async (commentId, replyId) => {
            await deleteReply(commentId, replyId);
          }}
        />
      </div>
    </div>
  );
}
