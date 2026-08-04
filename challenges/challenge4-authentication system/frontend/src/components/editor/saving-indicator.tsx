'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { useState, useEffect } from 'react';

export function SavingIndicator() {
  // In a real app, this state would come from a context or Zustand store
  // For now, it will be controlled externally or we can expose a store.
  // We'll simulate it by importing the hook from the editor later, 
  // or we can just use a simple static layout for now until connected.
  
  // This component needs to listen to a global "saveState" store.
  // We will build a simple custom event listener for now.
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    const handleSaveStatus = (e: any) => setStatus(e.detail);
    window.addEventListener('save-status', handleSaveStatus);
    return () => window.removeEventListener('save-status', handleSaveStatus);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <span>Saved to cloud</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Offline</span>
        </>
      )}
    </div>
  );
}
