'use client';

import { DocumentPermissionItem, PermissionLevel } from '@/lib/sharing.service';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PermissionSelector } from './PermissionSelector';
import { PermissionBadge } from './PermissionBadge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SharedUsersListProps {
  permissions: DocumentPermissionItem[];
  currentUserId: string;
  isOwner: boolean;
  onUpdatePermission: (permissionId: string, level: PermissionLevel) => void;
  onRemovePermission: (permissionId: string) => void;
}

export function SharedUsersList({
  permissions,
  currentUserId,
  isOwner,
  onUpdatePermission,
  onRemovePermission,
}: SharedUsersListProps) {
  if (!permissions.length) {
    return <p className="text-xs text-muted-foreground py-2">No users have been invited yet.</p>;
  }

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
      {permissions.map((item) => {
        const isSelf = item.userId === currentUserId;
        const isItemOwner = item.permission === 'OWNER';

        return (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-muted text-primary">
                  {item.user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate text-xs flex items-center gap-1.5">
                  {item.user?.name || item.user?.email}
                  {isSelf && <span className="text-[10px] text-muted-foreground font-normal">(You)</span>}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">{item.user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner && !isItemOwner ? (
                <>
                  <PermissionSelector
                    value={item.permission}
                    onChange={(level) => onUpdatePermission(item.id, level)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-600"
                    onClick={() => onRemovePermission(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <PermissionBadge permission={item.permission} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
