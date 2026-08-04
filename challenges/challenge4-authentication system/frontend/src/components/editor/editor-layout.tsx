'use client';

import { Document } from '@/lib/document.service';
import { DocumentHeader } from './document-header';
import { RichTextEditor } from './rich-text-editor';
import { EditorSidebar } from './editor-sidebar';
import { useEffect, useRef, useState } from 'react';
import { PermissionLevel } from '@/lib/sharing.service';

export function EditorLayout({ document }: { document: Document }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState<'comments' | 'history'>('comments');
  const [currentDocument, setCurrentDocument] = useState(document);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const userPermission: PermissionLevel = (currentDocument as any).userPermission || 'OWNER';

  useEffect(() => {
    setCurrentDocument(document);
  }, [document]);

  useEffect(() => {
    const handleDocumentRestored = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string }>).detail;
      if (detail?.title) {
        setCurrentDocument((current) => ({ ...current, title: detail.title }));
      }
    };

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string }>).detail;
      if (!detail?.message) {
        return;
      }

      setToastMessage(detail.message);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    };

    window.addEventListener('document-restored', handleDocumentRestored as EventListener);
    window.addEventListener('app-toast', handleToast as EventListener);

    return () => {
      window.removeEventListener('document-restored', handleDocumentRestored as EventListener);
      window.removeEventListener('app-toast', handleToast as EventListener);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="w-64 border-r border-border bg-secondary flex-shrink-0">
          <EditorSidebar />
        </div>
      )}
      
      <div className="flex flex-col flex-1 min-w-0">
        <DocumentHeader 
          document={currentDocument} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onOpenHistory={() => setRightSidebarTab('history')}
          userPermission={userPermission}
        />
        <div className="flex-1 overflow-y-auto">
          <RichTextEditor
            document={currentDocument}
            sidebarTab={rightSidebarTab}
            onSidebarTabChange={setRightSidebarTab}
            userPermission={userPermission}
          />
        </div>
      </div>

      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm">
          {toastMessage}
        </div>
      )}

    </div>
  );
}
