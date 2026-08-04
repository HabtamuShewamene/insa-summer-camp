'use client';

import { useCollaboration } from '@/lib/collaboration-context';
import { CollaboratorAvatar, UserStatus } from './collaborator-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CollaboratorUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  socketId: string;
  status?: UserStatus;
}

interface ActiveCollaboratorsProps {
  onOpenPanel?: () => void;
}

export function ActiveCollaborators({ onOpenPanel }: ActiveCollaboratorsProps) {
  const { activeUsers } = useCollaboration();

  // Map to our format (activeUsers from context already has the right shape)
  const collaborators: CollaboratorUser[] = activeUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: '',
    avatar: user.avatar,
    color: user.color || '#6B7280',
    socketId: user.socketId,
    status: 'online' as UserStatus,
  }));

  // Remove duplicates based on userId
  const uniqueCollaborators = collaborators.filter(
    (user, index, self) => index === self.findIndex((u) => u.id === user.id)
  );

  if (uniqueCollaborators.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="text-xs">No collaborators</span>
      </div>
    );
  }

  const displayCount = 3;
  const visibleUsers = uniqueCollaborators.slice(0, displayCount);
  const hiddenCount = uniqueCollaborators.length - displayCount;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.socketId} delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="cursor-pointer transition-transform hover:scale-110 hover:z-10">
                  <CollaboratorAvatar
                    name={user.name}
                    avatar={user.avatar}
                    color={user.color}
                    status={user.status}
                    size="md"
                    showStatus={true}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-medium">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">Currently editing</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {hiddenCount > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={onOpenPanel}
              >
                +{hiddenCount}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">View all collaborators</p>
            </TooltipContent>
          </Tooltip>
        )}

        <span className="text-xs text-muted-foreground ml-1">
          {uniqueCollaborators.length}{' '}
          {uniqueCollaborators.length === 1 ? 'user' : 'users'} editing
        </span>
      </div>
    </TooltipProvider>
  );
}
