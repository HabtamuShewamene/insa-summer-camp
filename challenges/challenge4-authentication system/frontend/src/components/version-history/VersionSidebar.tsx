'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentVersions } from '@/lib/use-document-versions';
import { VersionTimeline } from './VersionTimeline';
import { VersionPreview } from './VersionPreview';
import { RestoreDialog } from './RestoreDialog';

export function VersionSidebar({ documentId }: { documentId: string }) {
  const { versions, previewVersion, isLoading, error, previewVersionById, createVersion, restoreVersion } = useDocumentVersions(documentId);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeVersionId = previewVersion?.id ?? null;

  const selectedVersionNumber = restoreTarget;

  const handleCreateSnapshot = async () => {
    const created = await createVersion(snapshotNote.trim() || undefined);
    if (created) {
      setNotice('Snapshot saved.');
      setSnapshotNote('');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Snapshot saved.' } }));
    }
  };

  const handleRestore = async () => {
    if (!previewVersion) {
      return;
    }

    try {
      const result = await restoreVersion(previewVersion.id);
      setNotice(result.message);
      setRestoreTarget(null);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Document restored successfully.' } }));
      window.dispatchEvent(new CustomEvent('document-restored-local', { detail: result }));
    } catch (requestError: any) {
      setNotice(requestError?.response?.data?.message || requestError?.message || 'Failed to restore version');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Version history</div>
        <div className="mt-2 flex gap-2">
          <Input
            value={snapshotNote}
            onChange={(event) => setSnapshotNote(event.target.value)}
            placeholder="Snapshot note (optional)"
            className="h-9"
          />
          <Button onClick={handleCreateSnapshot} size="sm" className="shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Snapshot
          </Button>
        </div>
        {notice && <div className="mt-2 text-xs text-muted-foreground">{notice}</div>}
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">{error}</div>
        ) : versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No previous versions yet.
          </div>
        ) : (
          <div className="space-y-4">
            <VersionTimeline versions={versions} activeVersionId={activeVersionId} onView={previewVersionById} />
            {previewVersion && (
              <VersionPreview
                key={previewVersion.id}
                version={previewVersion}
                onRestore={() => setRestoreTarget(previewVersion.versionNumber)}
              />
            )}
          </div>
        )}
      </ScrollArea>

      <RestoreDialog
        open={restoreTarget !== null}
        versionNumber={selectedVersionNumber}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </div>
  );
}