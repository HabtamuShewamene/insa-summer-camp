'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';

export function CreateComment({
  selectedText,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  selectedText: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const [content, setContent] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    onSubmit(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected text</div>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground/80">{selectedText}</div>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          Comment
        </Button>
      </div>
    </form>
  );
}