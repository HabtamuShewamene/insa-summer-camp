'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/lib/document.service';
import { EditorLayout } from '@/components/editor/editor-layout';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['document', resolvedParams.id],
    queryFn: () => documentService.getDocument(resolvedParams.id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Document not found</h2>
        <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist or you don't have access.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <EditorLayout document={data.document} />;
}
