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
import { CommentSidebar } from '../comments/comment-sidebar';
import { FloatingCommentToolbar } from '../comments/comment-button';
import { CommentHighlight } from '@/lib/extensions/comment-highlight';
import { Document } from '@/lib/document.service';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useDocumentCollaboration } from '@/lib/use-document-collaboration';
import { useCollaboration } from '@/lib/collaboration-context';
import { usePresenceTracking } from '@/lib/use-presence-tracking';
import { useAuth } from '@/lib/auth-context';
import { useCommentSocket } from '@/hooks/use-comment-socket';
import { useCreateComment } from '@/hooks/use-comments';
import { PositionData } from '@/lib/comment.service';
import { Loader2 } from 'lucide-react';
import { ReadOnlyBanner } from '@/components/sharing/ReadOnlyBanner';
import { PermissionLevel } from '@/lib/sharing.service';

interface EnhancedRichTextEditorProps {
  document: Document;
  userPermission?: PermissionLevel;
  onCommentHighlight?: (commentId: string) => void;
}

export function EnhancedRichTextEditor({
  document,
  userPermission = 'OWNER',
  onCommentHighlight,
}: EnhancedRichTextEditorProps) {
  const { user } = useAuth();
  const { status } = useCollaboration();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<PositionData | null>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const createCommentMutation = useCreateComment(document.id);

  const { ydoc, provider, isSynced } = useDocumentCollaboration({
    documentId: document.id,
    enabled: true,
    onSynced: () => {
      console.log('[EnhancedRichTextEditor] Document synced');
    },
    onError: (error) => {
      console.error('[EnhancedRichTextEditor] Collaboration error:', error);
    },
  });

  // Initialize real-time comment updates
  useCommentSocket(document.id);

  usePresenceTracking({
    documentId: document.id,
    enabled: true,
  });

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

  const isEditable = userPermission === 'OWNER' || userPermission === 'EDITOR';
  const canComment = ['OWNER', 'EDITOR', 'COMMENTER'].includes(userPermission);

  const debouncedSave = useRef(
    debounce(async (jsonContent: any) => {
      if (!isEditable) return;
      try {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saving' }));
        // Save logic would go here
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'saved' }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('save-status', { detail: 'error' }));
      }
    }, 2000)
  ).current;

  const editor = useEditor({
    editable: isEditable,
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
      CommentHighlight,
      Placeholder.configure({
        placeholder: isEditable ? 'Start writing...' : 'View only mode',
        emptyEditorClass: 'is-editor-empty',
      }),
      ...(ydoc && provider ? [
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider.awareness,
          user: {
            name: user?.name || 'Anonymous',
            color: provider.awareness.getLocalState()?.user?.color || '#000000',
          },
        }),
      ] : []),
    ],
    content: document.content?.content || '',
    autofocus: isEditable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[500px] px-8 py-8',
      },
      handleClick: (view, pos, event) => {
        // Handle comment highlight clicks
        const target = event.target as HTMLElement;
        if (target.hasAttribute('data-comment-id')) {
          const commentId = target.getAttribute('data-comment-id');
          if (commentId && onCommentHighlight) {
            onCommentHighlight(commentId);
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      if (isEditable) {
        debouncedSave(tiptapEditor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor: tiptapEditor }) => {
      const { from, to } = tiptapEditor.state.selection;
      
      if (from === to) {
        // No selection
        setSelectedText('');
        setSelectedRange(null);
        setShowFloatingToolbar(false);
        return;
      }

      if (!canComment) {
        return;
      }

      const text = tiptapEditor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);
      setSelectedRange({ from, to });

      // Calculate toolbar position
      const { view } = tiptapEditor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      setToolbarPosition({
        top: start.top - 10,
        left: Math.min(start.left, end.left),
      });
      
      setShowFloatingToolbar(true);
    },
  });

  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  const handleAddComment = () => {
    if (!selectedText || !selectedRange) return;
    
    // The FloatingCommentToolbar will handle opening the dialog
    setShowFloatingToolbar(false);
  };

  const handleCommentCreated = () => {
    // Clear selection and hide toolbar
    setSelectedText('');
    setSelectedRange(null);
    setShowFloatingToolbar(false);
    
    // Optionally open comment sidebar
    setIsCommentSidebarOpen(true);
  };

  const handleHighlightComment = (commentId: string) => {
    // Scroll to and highlight the comment in the editor
    if (editor) {
      // Find the comment highlight and scroll to it
      const commentElements = globalThis.document.querySelectorAll(`[data-comment-id="${commentId}"]`);
      if (commentElements.length > 0) {
        commentElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Temporarily highlight the comment
        commentElements.forEach(el => {
          el.classList.add('bg-yellow-300');
          setTimeout(() => {
            el.classList.remove('bg-yellow-300');
          }, 2000);
        });
      }
    }
  };

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ReadOnlyBanner permission={userPermission} />
      
      <div className="flex flex-1 min-h-0">
        {/* Main Editor */}
        <div className="flex min-w-0 flex-1 flex-col relative">
          {isEditable && (
            <EditorToolbar 
              editor={editor} 
              onAddComment={handleAddComment}
            />
          )}
          
          <div className="flex-1 overflow-y-auto bg-background relative">
            <div className="max-w-4xl mx-auto w-full">
              <EditorContent editor={editor} />
            </div>

            {/* Floating Comment Toolbar */}
            <FloatingCommentToolbar
              documentId={document.id}
              isVisible={showFloatingToolbar && canComment}
              selectedText={selectedText}
              positionData={selectedRange || undefined}
              position={toolbarPosition}
              onCommentCreated={handleCommentCreated}
              onClose={() => setShowFloatingToolbar(false)}
            />
          </div>
        </div>

        {/* Comment Sidebar */}
        <CommentSidebar
          documentId={document.id}
          isOpen={isCommentSidebarOpen}
          onToggle={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          onHighlightComment={handleHighlightComment}
          className="border-l border-border"
        />
      </div>
    </div>
  );
}
