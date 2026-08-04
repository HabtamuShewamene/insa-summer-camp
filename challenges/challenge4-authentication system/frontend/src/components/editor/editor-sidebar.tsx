'use client';

import { FileText, Settings, Search, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EditorSidebar() {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
        Workspace
      </div>
      <nav className="space-y-1">
        <Button variant="ghost" className="w-full justify-start text-sm">
          <FileText className="mr-2 h-4 w-4" />
          Pages
        </Button>
        <Button variant="ghost" className="w-full justify-start text-sm">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button variant="ghost" className="w-full justify-start text-sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </nav>
      
      <div className="mt-8 text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
        Outline
      </div>
      <div className="text-sm text-muted-foreground/70 px-4">
        Outline will appear here based on headings.
      </div>
    </div>
  );
}
