'use client';

import { Document } from '@/lib/document.service';
import { DocumentHeader } from './document-header';
import { RichTextEditor } from './rich-text-editor';
import { EditorSidebar } from './editor-sidebar';
import { useState } from 'react';

export function EditorLayout({ document }: { document: Document }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Optional toggleable left sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r border-border bg-secondary flex-shrink-0">
          <EditorSidebar />
        </div>
      )}
      
      <div className="flex flex-col flex-1 min-w-0">
        <DocumentHeader 
          document={document} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <div className="flex-1 overflow-y-auto">
          <RichTextEditor document={document} />
        </div>
      </div>

      {/* Right Sidebar - To be implemented in future for comments/sharing */}
      {/* <div className="w-64 border-l border-border bg-secondary hidden lg:block"></div> */}
    </div>
  );
}
