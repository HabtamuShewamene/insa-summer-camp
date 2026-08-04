'use client';

import { Document } from '@/lib/document.service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, Share2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SavingIndicator } from './saving-indicator';
import { useEffect, useState } from 'react';

export function DocumentHeader({ 
  document, 
  toggleSidebar 
}: { 
  document: Document; 
  toggleSidebar: () => void;
}) {
  const router = useRouter();
  const [collabStatus, setCollabStatus] = useState('Connecting...');

  useEffect(() => {
    const handleStatus = (e: any) => setCollabStatus(e.detail);
    window.addEventListener('collab-status', handleStatus);
    return () => window.removeEventListener('collab-status', handleStatus);
  }, []);

  return (
    <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        
        <div className="h-4 w-px bg-border mx-2" />
        
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-sm max-w-[200px] truncate">
            {document.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {collabStatus}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SavingIndicator />
        
        <div className="flex items-center gap-2">
          {/* Active Users Avatars */}
          <ActiveUsers />
          
          <Button variant="outline" size="sm" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Avatar className="h-8 w-8 ml-2">
            <AvatarImage src="" />
            <AvatarFallback>{document.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

function ActiveUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // In a full implementation, we'd listen to the awareness state changes for this, 
    // or from Socket.IO 'room-users'. Let's listen to 'room-users' from the provider wrapper.
    const handleRoomUsers = (e: any) => setUsers(e.detail);
    window.addEventListener('room-users', handleRoomUsers);
    return () => window.removeEventListener('room-users', handleRoomUsers);
  }, []);

  if (users.length <= 1) return null; // Don't show if it's just me

  return (
    <div className="flex items-center mr-2">
      <div className="flex -space-x-2 mr-2">
        {users.slice(0, 3).map((u, i) => (
          <Avatar key={i} className="h-7 w-7 border-2 border-background" style={{ borderColor: 'hsl(var(--background))' }}>
            <AvatarImage src="" />
            <AvatarFallback style={{ backgroundColor: u.color, color: '#fff' }} className="text-[10px]">
              {u.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {users.length > 3 && (
        <span className="text-xs text-muted-foreground font-medium">+{users.length - 3}</span>
      )}
    </div>
  );
}
