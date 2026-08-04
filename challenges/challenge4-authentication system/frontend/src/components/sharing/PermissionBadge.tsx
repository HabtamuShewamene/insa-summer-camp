'use client';

import { Badge } from '@/components/ui/badge';
import { PermissionLevel } from '@/lib/sharing.service';
import { Crown, Edit3, MessageSquare, Eye } from 'lucide-react';

export function PermissionBadge({ permission }: { permission: PermissionLevel }) {
  switch (permission) {
    case 'OWNER':
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 font-medium">
          <Crown className="h-3 w-3" /> Owner
        </Badge>
      );
    case 'EDITOR':
      return (
        <Badge variant="secondary" className="gap-1 font-medium">
          <Edit3 className="h-3 w-3" /> Editor
        </Badge>
      );
    case 'COMMENTER':
      return (
        <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">
          <MessageSquare className="h-3 w-3" /> Commenter
        </Badge>
      );
    case 'VIEWER':
    default:
      return (
        <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">
          <Eye className="h-3 w-3" /> Viewer
        </Badge>
      );
  }
}
