'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, FileText, MessageSquare, Loader2, X } from 'lucide-react';
import { useSearch, useRecentSearches } from '@/hooks/use-search';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const { search, results, isLoading, hasQuery, took } = useSearch();
  const { data: recentSearches } = useRecentSearches();

  useEffect(() => {
    search(inputValue);
  }, [inputValue, search]);

  const handleResultClick = (documentId: string) => {
    router.push(`/editor/${documentId}`);
    onOpenChange(false);
    setInputValue('');
  };

  const handleRecentClick = (query: string) => {
    setInputValue(query);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-black font-medium">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'title':
        return 'Title match';
      case 'content':
        return 'Content match';
      case 'comment':
        return 'Comment match';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search documents, comments..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              autoFocus
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="p-4 pt-2">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!hasQuery && recentSearches && recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  <span>Recent searches</span>
                </div>
                {recentSearches.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(query)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
                  >
                    {query}
                  </button>
                ))}
              </div>
            )}

            {hasQuery && !isLoading && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No results found</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try different keywords
                </p>
              </div>
            )}

            {hasQuery && !isLoading && results.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground mb-3">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} in {took}ms
                </div>
                <div className="space-y-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.id)}
                      className="w-full text-left p-3 rounded border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getMatchTypeIcon(result.matchType)}
                          <h3 className="font-medium text-sm truncate">
                            {highlightText(result.title, inputValue)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {result.isShared && (
                            <Badge variant="secondary" className="text-xs">
                              Shared
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getMatchTypeLabel(result.matchType)}
                          </Badge>
                        </div>
                      </div>
                      
                      {result.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {highlightText(result.excerpt, inputValue)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{result.owner.name}</span>
                        <span>•</span>
                        <span>
                          {new Date(result.createdAt).toLocaleDateString()}
                        </span>
                        {result.commentCount !== undefined && result.commentCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {result.commentCount}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3 bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-background border border-border rounded">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-background border border-border rounded">
                Enter
              </kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-background border border-border rounded">
                Esc
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}