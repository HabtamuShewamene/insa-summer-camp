'use client';

import { Badge } from '@/components/ui/badge';

export function CommentBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return <Badge variant="outline" className="rounded-full border-border bg-muted/50 text-foreground">{count}</Badge>;
}