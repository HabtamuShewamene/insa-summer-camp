'use client';

import { MessageSquare } from 'lucide-react';

export function EmptyComments() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h3 className="font-medium text-sm text-muted-foreground mb-2">
        No comments yet
      </h3>
      <p className="text-xs text-muted-foreground/70 max-w-[200px]">
        Select text to start a discussion
      </p>
    </div>
  );
}