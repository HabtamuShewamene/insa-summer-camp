'use client';

import { DocumentVersionListItem } from '@/lib/version-history.service';
import { VersionItem } from './VersionItem';

export function VersionTimeline({
  versions,
  activeVersionId,
  onView,
}: {
  versions: DocumentVersionListItem[];
  activeVersionId?: string | null;
  onView: (versionId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <VersionItem
          key={version.id}
          version={version}
          active={activeVersionId === version.id}
          onView={() => onView(version.id)}
        />
      ))}
    </div>
  );
}