'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/lib/document.service';
import { EditorLayout } from '@/components/editor/editor-layout';
import { AccessDenied } from '@/components/sharing/AccessDenied';
import { Loader2 } from 'lucide-react';
import { use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['document', resolvedParams.id],
    queryFn: () => documentService.getDocument(resolvedParams.id),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-background overflow-hidden">
        <div className="h-14 border-b w-full flex items-center justify-between px-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full space-y-4">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full mt-6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  // Log error for debugging
  if (error) {
    console.error('Document fetch error:', error);
  }

  // Check if we have valid document data
  if (error || !data || !data.document) {
    return <AccessDenied />;
  }

  return <EditorLayout document={data.document} />;
}
