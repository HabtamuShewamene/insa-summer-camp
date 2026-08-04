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
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { useDocumentCollaboration } from '@/lib/use-document-collaboration';
import { useCollaboration } from '@/lib/collaboration-context';
import { usePresenceTracking } from '@/lib/use-presence-tracking';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

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
  // Activity tracking
  usePresenceTracking({
    documentId: document.id,
    enabled: true,
  });

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
  });

  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full relative">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto w-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
