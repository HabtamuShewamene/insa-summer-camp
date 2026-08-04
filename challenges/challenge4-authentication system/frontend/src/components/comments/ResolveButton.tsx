'use client';

import { Button } from '@/components/ui/button';

export function ResolveButton({
  isResolved,
  onClick,
}: {
  isResolved: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="h-8 px-2 text-xs text-muted-foreground">
      {isResolved ? 'Reopen' : 'Resolve'}
    </Button>
  );
}