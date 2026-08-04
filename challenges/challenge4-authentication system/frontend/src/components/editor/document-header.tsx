'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, documentService } from '@/lib/document.service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Menu, Share2, Users, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SavingIndicator } from './saving-indicator';
import { ConnectionStatus } from '@/components/collaboration/connection-status';
import { ActiveCollaborators } from '@/components/collaboration/active-users';
import { TypingIndicator } from '@/components/collaboration/typing-indicator';
import { CollaboratorPanel } from '@/components/collaboration/collaborator-panel';
import { Separator } from '@/components/ui/separator';
import { useCollaboration } from '@/lib/collaboration-context';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { PermissionBadge } from '@/components/sharing/PermissionBadge';
import { PermissionLevel } from '@/lib/sharing.service';
import { useAuth } from '@/lib/auth-context';
import { useComments } from '@/hooks/use-comments';

export function DocumentHeader({ 
  document, 
  toggleSidebar,
  onOpenHistory,
  onToggleComments,
  userPermission = 'OWNER',
}: { 
  document: Document; 
  toggleSidebar: () => void;
  onOpenHistory: () => void;
  onToggleComments?: () => void;
  userPermission?: PermissionLevel;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeUsers } = useCollaboration();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [typingUsers] = useState<any[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(document.title);
  const renameRef = useRef<HTMLInputElement>(null);

  // Sync rename value if document title changes externally
  useEffect(() => {
    if (!isRenaming) setRenameValue(document.title);
  }, [document.title, isRenaming]);

  const startRename = () => {
    if (userPermission !== 'OWNER' && userPermission !== 'EDITOR') return;
    setRenameValue(document.title);
    setIsRenaming(true);
    setTimeout(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    }, 50);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim() || 'Untitled Document';
    setIsRenaming(false);
    if (trimmed !== document.title) {
      try {
        await documentService.renameDocument(document.id, trimmed);
        // Broadcast to collaborators via custom event
        window.dispatchEvent(new CustomEvent('document-renamed', { detail: { title: trimmed } }));
      } catch {
        setRenameValue(document.title); // revert on error
      }
    }
  };

  // Get comment count
  const { data: commentsData } = useComments(document.id, false);
  const activeCommentCount = commentsData?.comments?.filter((c: any) => c.status === 'ACTIVE').length || 0;

  const isOwner = userPermission === 'OWNER' || document.ownerId === user?.id;
  const canEdit = userPermission === 'OWNER' || userPermission === 'EDITOR';

  const collaborators = activeUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: '',
    avatar: u.avatar,
    color: u.color || '#6B7280',
    status: 'online' as const,
    lastActive: new Date(),
    joinedAt: new Date(),
  }));

  return (
    <>
      <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        {/* Left: nav + title */}
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
          
          {/* Inline-editable title */}
          <div className="flex flex-col justify-center min-w-0 flex-1 ml-2">
            <div className="flex items-center gap-3 overflow-hidden">
              {isRenaming ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(document.title); }
                  }}
                  className="font-semibold text-sm bg-transparent border-b-2 border-primary outline-none w-full max-w-[300px] sm:max-w-[400px]"
                />
              ) : (
                <span
                  className={`font-semibold text-sm truncate max-w-[200px] sm:max-w-[400px] ${canEdit ? 'cursor-text hover:bg-muted/50 rounded px-1 -mx-1' : ''}`}
                  onDoubleClick={startRename}
                  title={canEdit ? 'Double-click to rename' : document.title}
                >
                  {renameValue || 'Untitled Document'}
                </span>
              )}
              <div className="shrink-0">
                <PermissionBadge permission={userPermission} />
              </div>
            </div>
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <SavingIndicator />
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <ConnectionStatus />
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <ActiveCollaborators onOpenPanel={() => setIsPanelOpen(true)} />
          <Separator orientation="vertical" className="h-4 hidden sm:block" />

          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleComments}
            className="relative"
            title="Comments"
          >
            <MessageSquare className="h-4 w-4" />
            {activeCommentCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {activeCommentCount}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="relative"
            title="Collaborators"
          >
            <Users className="h-4 w-4" />
            {collaborators.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {collaborators.length}
              </span>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button variant="outline" size="sm" onClick={onOpenHistory}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          
          <Avatar className="h-8 w-8 ml-1">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CollaboratorPanel
        collaborators={collaborators}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />

      <ShareDialog
        documentId={document.id}
        documentTitle={document.title}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        isOwner={isOwner}
      />
    </>
  );
}
