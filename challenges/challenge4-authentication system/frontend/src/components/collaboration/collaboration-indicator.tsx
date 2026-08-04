'use client';

import { ConnectionStatus } from './connection-status';
import { ActiveUsers } from './active-users';
import { Separator } from '@/components/ui/separator';

export function CollaborationIndicator() {
  return (
    <div className="flex items-center gap-3">
      <ConnectionStatus />
      <Separator orientation="vertical" className="h-4" />
      <ActiveUsers />
    </div>
  );
}
