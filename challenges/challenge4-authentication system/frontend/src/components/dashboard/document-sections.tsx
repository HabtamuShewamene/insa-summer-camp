'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentCard } from './document-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DocumentSections() {
  const [activeTab, setActiveTab] = useState<'my-docs' | 'shared' | 'recent'>('my-docs');
  const myDocs = [{ id: '1', title: 'Sprint Planning Q3', lastModified: '2 hours ago', owner: 'Me', status: 'Draft' }, { id: '2', title: 'Architecture Overview', lastModified: 'Yesterday', owner: 'Me', status: 'Final' }];
  const sharedDocs = [{ id: '3', title: 'Weekly Sync Notes', lastModified: '3 hours ago', sharedBy: 'Sarah Connor', permission: 'Editor' }];
  const recentDocs = [...myDocs, ...sharedDocs].sort(() => Math.random() - 0.5);
  const docs = activeTab === 'my-docs' ? myDocs : activeTab === 'shared' ? sharedDocs : recentDocs;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[{ id: 'my-docs', label: 'My Documents' }, { id: 'shared', label: 'Shared With Me' }, { id: 'recent', label: 'Recently Opened' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`}>{tab.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter documents..." className="pl-9 bg-background" />
          </div>
          <Button><PlusCircle className="h-4 w-4 mr-2" />New Document</Button>
        </div>
      </div>
      {docs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc, idx) => <DocumentCard key={doc.id} doc={doc} index={idx} tab={activeTab} />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-background/50 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4"><FileText className="h-10 w-10 text-primary" /></div>
          <h3 className="text-xl font-bold mb-2">No documents yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">Get started by creating your first document and collaborating with your team in real time.</p>
          <Button size="lg"><PlusCircle className="h-5 w-5 mr-2" />Create Your First Document</Button>
        </motion.div>
      )}
    </div>
  );
}