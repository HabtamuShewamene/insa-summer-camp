'use client';

import { useState } from 'react';
import { Document } from '@/lib/document.service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Menu, Share2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SavingIndicator } from './saving-indicator';
import { ConnectionStatus } from '@/components/collaboration/connection-status';
import { ActiveCollaborators } from '@/components/collaboration/active-users';
import { TypingIndicator } from '@/components/collaboration/typing-indicator';
import { CollaboratorPanel } from '@/components/collaboration/collaborator-panel';
import { Separator } from '@/components/ui/separator';
import { useCollaboration } from '@/lib/collaboration-context';

export function DocumentHeader({ 
  document, 
  toggleSidebar,
  onOpenHistory,
}: { 
  document: Document; 
  toggleSidebar: () => void;
  onOpenHistory: () => void;
}) {
  const router = useRouter();
  const { activeUsers } = useCollaboration();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  // Map active users to collaborator format
  const collaborators = activeUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: '',
    avatar: user.avatar,
    color: user.color || '#6B7280',
    status: 'online' as const,
    lastActive: new Date(),
    joinedAt: new Date(),
  }));

  return (
    <>
      <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard')} 
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-2" />
          
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="font-semibold text-sm truncate">
              {document.title}
            </span>
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SavingIndicator />
          
          <Separator orientation="vertical" className="h-4" />
          
          <ConnectionStatus />
          
          <Separator orientation="vertical" className="h-4" />
          
          <ActiveCollaborators onOpenPanel={() => setIsPanelOpen(true)} />
          
          <Separator orientation="vertical" className="h-4" />
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="relative"
            >
              <Users className="h-4 w-4" />
              {collaborators.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                  {collaborators.length}
                </span>
              )}
            </Button>
            
            <Button variant="outline" size="sm" disabled>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button variant="outline" size="sm" onClick={onOpenHistory}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            
            <Avatar className="h-8 w-8 ml-2">
              <AvatarImage src="" />
              <AvatarFallback>{document.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Collaborator Panel */}
      <CollaboratorPanel
        collaborators={collaborators}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
