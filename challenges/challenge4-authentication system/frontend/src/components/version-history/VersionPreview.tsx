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
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DocumentVersionDetail } from '@/lib/version-history.service';

export function VersionPreview({
  version,
  onRestore,
}: {
  version: DocumentVersionDetail;
  onRestore: () => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Typography,
      CharacterCount,
      Placeholder.configure({ placeholder: 'Version preview', emptyEditorClass: 'is-editor-empty' }),
    ],
    content: version.content || '',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[240px] px-4 py-4 dark:prose-invert',
      },
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Version {version.versionNumber}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {version.createdBy.name} · {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
          </div>
        </div>
        <Button size="sm" onClick={onRestore}>Restore this version</Button>
      </div>

      {version.changeDescription && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/80">
          {version.changeDescription}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-muted/10">
        {editor && <EditorContent editor={editor} />}
      </div>
    </div>
  );
}