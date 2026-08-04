'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchDialog } from './search-dialog';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full justify-start text-muted-foreground hover:text-foreground',
          className
        )}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="text-sm">Search documents...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

// Compact search button for headers
export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="Search (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
      </Button>

      <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}