'use client';

import { Document } from '@/lib/document.service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, Share2, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SavingIndicator } from './saving-indicator';

export function DocumentHeader({ 
  document, 
  toggleSidebar 
}: { 
  document: Document; 
  toggleSidebar: () => void;
}) {
  const router = useRouter();

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
        
        <div className="flex items-center gap-2 group cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors">
          <span className="font-semibold text-sm max-w-[200px] truncate">
            {document.title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SavingIndicator />
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
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
