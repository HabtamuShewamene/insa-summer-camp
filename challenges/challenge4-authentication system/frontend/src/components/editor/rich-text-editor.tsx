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
import { EditorToolbar } from './editor-toolbar';
import { Document, documentService } from '@/lib/document.service';
import { useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

export function RichTextEditor({ document }: { document: Document }) {
  const content = document.content?.content || '';

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
    ],
    content,
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
