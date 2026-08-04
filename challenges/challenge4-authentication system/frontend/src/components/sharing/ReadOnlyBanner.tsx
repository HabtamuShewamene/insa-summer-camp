'use client';

import { PermissionLevel } from '@/lib/sharing.service';
import { Eye, MessageSquare } from 'lucide-react';

export function ReadOnlyBanner({ permission }: { permission: PermissionLevel }) {
  if (permission === 'OWNER' || permission === 'EDITOR') return null;

  if (permission === 'COMMENTER') {
    return (
      <div className="bg-muted/80 border-b border-border px-4 py-1.5 text-xs text-muted-foreground flex items-center justify-center gap-2 shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
        <span><strong>Comment-only mode</strong> — You can view document and leave comments, but editing is disabled.</span>
      </div>
    );
  }

  return (
    <div className="bg-muted/80 border-b border-border px-4 py-1.5 text-xs text-muted-foreground flex items-center justify-center gap-2 shrink-0">
      <Eye className="h-3.5 w-3.5 text-primary" />
      <span><strong>View-only mode</strong> — You have read-only access to this document.</span>
    </div>
  );
}
