'use client';

import { Button } from '@/components/ui/button';

export function RestoreDialog({
  open,
  versionNumber,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  versionNumber: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || versionNumber === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-lg">
        <div className="text-sm font-medium text-foreground">Restore Version {versionNumber}?</div>
        <p className="mt-2 text-sm text-muted-foreground">This will replace the current document.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Restore</Button>
        </div>
      </div>
    </div>
  );
}