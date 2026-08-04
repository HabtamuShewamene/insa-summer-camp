'use client';

import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentVersionListItem } from '@/lib/version-history.service';

export function VersionItem({
  version,
  active,
  onView,
}: {
  version: DocumentVersionListItem;
  active?: boolean;
  onView: () => void;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-background p-3 shadow-sm transition', active && 'border-foreground/20 bg-muted/30')}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-[10px]">{version.createdBy.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-foreground">Version {version.versionNumber}</div>
              <div className="text-xs text-muted-foreground">{version.createdBy.name}</div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onView}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
          </div>

          {version.changeDescription && (
            <div className="mt-2 text-sm leading-5 text-foreground/80">{version.changeDescription}</div>
          )}
        </div>
      </div>
    </div>
  );
}