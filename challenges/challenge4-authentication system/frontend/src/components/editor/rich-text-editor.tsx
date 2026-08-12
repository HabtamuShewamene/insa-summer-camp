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
import { EditorToolbar } from './editor-toolbar';
import { Document, documentService } from '@/lib/document.service';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useDocumentCollaboration } from '@/lib/use-document-collaboration';
import { useCollaboration } from '@/lib/collaboration-context';
import { usePresenceTracking } from '@/lib/use-presence-tracking';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { useDocumentComments } from '@/lib/use-document-comments';
import { DocumentSidebar } from './document-sidebar';
import { ReadOnlyBanner } from '@/components/sharing/ReadOnlyBanner';
import { PermissionLevel } from '@/lib/sharing.service';
import { SocketIOProvider } from '@/lib/yjs-socket-provider';
import * as Y from 'yjs';
import type { User } from '@/lib/api';

interface EditorInstanceProps {
  document: Document;
  provider: SocketIOProvider;
  ydoc: Y.Doc;
  user: User;
  sidebarTab: 'comments' | 'history';
  onSidebarTabChange: (tab: 'comments' | 'history') => void;
  userPermission: PermissionLevel;
}

// ── Outer wrapper — waits for ydoc + provider before rendering editor ────────

export function RichTextEditor({
  document,
  sidebarTab,
  onSidebarTabChange,
  userPermission = 'OWNER',
}: {
  document: Document;
  sidebarTab: 'comments' | 'history';
  onSidebarTabChange: (tab: 'comments' | 'history') => void;
  userPermission?: PermissionLevel;
}) {
  const { user } = useAuth();
  const { status } = useCollaboration();
  const { ydoc, provider, isSynced } = useDocumentCollaboration({
    documentId: document.id,
    enabled: true,
  });

  useEffect(() => {
    const statusMap: Record<string, string> = {
      connecting: 'Connecting...',
      connected: isSynced ? 'Connected' : 'Syncing...',
      reconnecting: 'Reconnecting...',
      disconnected: 'Offline',
      offline: 'Offline',
      error: 'Sync Failed',
    };
    window.dispatchEvent(
      new CustomEvent('collab-status', { detail: statusMap[status] ?? 'Unknown' })
    );
  }, [status, isSynced]);

  // Don't render the editor until the ydoc AND the provider awareness are ready
  if (!ydoc || !provider || !provider.awareness || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <EditorInstance
      document={document}
      provider={provider}
      ydoc={ydoc}
      user={user}
      sidebarTab={sidebarTab}
      onSidebarTabChange={onSidebarTabChange}
      userPermission={userPermission}
    />
  );
}

// ── Inner editor — only mounts when all dependencies are ready ───────────────

function EditorInstance({
  document,
  provider,
  ydoc,
  user,
  sidebarTab,
  onSidebarTabChange,
  userPermission,
}: EditorInstanceProps) {
  const isEditable = userPermission === 'OWNER' || userPermission === 'EDITOR';

  const {
    activeComments,
    resolvedComments,
    createComment,
    replyToComment,
    resolveComment,
    reopenComment,
    deleteComment,
    deleteReply,
  } = useDocumentComments(document.id);

  usePresenceTracking({ documentId: document.id, enabled: true });

  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(null);
  const [isCommentDraftOpen, setIsCommentDraftOpen] = useState(false);

  const debouncedSave = useRef(
    debounce(async (jsonContent: unknown) => {
      if (!isEditable) return;
      try {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saving' }));
        await documentService.updateContent(document.id, jsonContent as Record<string, unknown>);
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saved' }));
      } catch {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'error' }));
      }
    }, 2000)
  ).current;

  const editor = useEditor({
    editable: isEditable,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable built-in history — Collaboration (Yjs) handles undo/redo
        history: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Typography,
      CharacterCount,
      Placeholder.configure({
        placeholder: isEditable ? 'Start writing…' : 'View-only document',
        emptyEditorClass: 'is-editor-empty',
      }),
      // Collaboration extension binds Yjs doc to the editor
      Collaboration.configure({ document: ydoc }),
      // CollaborationCursor is intentionally omitted — the awareness plugin
      // it depends on has a race condition during ProseMirror view init that
      // causes "Cannot read properties of undefined (reading 'doc')".
      // Presence is tracked separately via SocketIOProvider awareness events.
    ],
    // ⚠️ Never pass `content` when using Collaboration — Yjs owns the content
    content: undefined,
    autofocus: isEditable,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[500px] px-8 sm:px-12 md:px-24 py-12 md:py-16',
      },
    },
    onUpdate: ({ editor }) => {
      if (isEditable) {
        debouncedSave(editor.getJSON());
      }
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

  // Restore content from DB when server sends it (server Yjs was empty after restart)
  useEffect(() => {
    const handleLoadDbContent = (e: Event) => {
      const content = (e as CustomEvent).detail;
      if (!editor || !content) return;
      // Only restore if editor is currently empty
      const isEmpty = editor.state.doc.textContent.trim() === '';
      if (isEmpty) {
        editor.commands.setContent(content, false); // false = don't emit update
      }
    };
    window.addEventListener('load-db-content', handleLoadDbContent);
    return () => window.removeEventListener('load-db-content', handleLoadDbContent);
  }, [editor]);

  const userColor = provider.awareness.getLocalState()?.user?.color ?? '#6366f1';

  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  if (!editor) return null;

  const handleAddComment = () => {
    if (!selectedText || !selectedRange) return;
    editor.chain().focus().setTextSelection(selectedRange).run();
    setIsCommentDraftOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ReadOnlyBanner permission={userPermission} />
      <div className="flex flex-1 min-h-0">
        {/* Editor area */}
        <div className="flex min-w-0 flex-1 flex-col relative">
          {isEditable && <EditorToolbar editor={editor} onAddComment={handleAddComment} />}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-4xl mx-auto w-full">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Right sidebar — comments + history */}
        <div className="hidden w-[380px] shrink-0 xl:block">
          <DocumentSidebar
            documentId={document.id}
            documentTitle={document.title}
            activeTab={sidebarTab}
            onTabChange={onSidebarTabChange}
            activeComments={activeComments}
            resolvedComments={resolvedComments}
            selectedText={selectedText}
            selectedRange={selectedRange}
            isComposerOpen={isCommentDraftOpen}
            onOpenComposer={() => setIsCommentDraftOpen(true)}
            onCancelComposer={() => setIsCommentDraftOpen(false)}
            onCreateComment={async (content) => {
              if (!selectedText || !selectedRange) return;
              editor
                .chain()
                .focus()
                .setTextSelection(selectedRange)
                .setHighlight({ color: 'rgba(0,0,0,0.08)' })
                .run();
              await createComment({ content, selectedText, positionData: selectedRange });
              setIsCommentDraftOpen(false);
            }}
            onReply={async (commentId, content) => replyToComment(commentId, { content })}
            onResolve={async (commentId) => resolveComment(commentId)}
            onReopen={async (commentId) => reopenComment(commentId)}
            onDelete={async (commentId) => deleteComment(commentId)}
            onDeleteReply={async (commentId, replyId) => deleteReply(commentId, replyId)}
          />
        </div>
      </div>
    </div>
  );
}
