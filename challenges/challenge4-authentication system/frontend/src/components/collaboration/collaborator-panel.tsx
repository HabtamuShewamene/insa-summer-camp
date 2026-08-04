'use client';

import { CollaboratorAvatar, UserStatus } from './collaborator-avatar';
import { PresenceStatus } from './presence-status';
import { Button } from '@/components/ui/button';
import { X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CollaboratorUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  status: UserStatus;
  lastActive?: Date;
  joinedAt?: Date;
}

interface CollaboratorPanelProps {
  collaborators: CollaboratorUser[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function CollaboratorPanel({
  collaborators,
  isOpen,
  onClose,
  className,
}: CollaboratorPanelProps) {
  const getActivityText = (user: CollaboratorUser) => {
    if (user.status === 'online') {
      return 'Editing';
    } else if (user.status === 'idle') {
      if (user.lastActive) {
        return `Idle ${formatDistanceToNow(user.lastActive, { addSuffix: true })}`;
      }
      return 'Idle';
    }
    return 'Away';
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg z-50 animate-in slide-in-from-right duration-300',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="font-semibold text-sm">
              Currently Viewing ({collaborators.length})
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Collaborators List */}
        <div className="flex-1 overflow-y-auto p-4">
          {collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No collaborators</p>
              <p className="text-xs mt-1">
                When others join, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collaborators.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <CollaboratorAvatar
                    name={user.name}
                    avatar={user.avatar}
                    color={user.color}
                    status={user.status}
                    size="lg"
                    showStatus={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {user.name}
                      </h3>
                      <PresenceStatus status={user.status} size="sm" />
                    </div>
                    
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {getActivityText(user)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Collaborators are updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
