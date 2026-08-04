'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/lib/document.service';
import { EditorLayout } from '@/components/editor/editor-layout';
import { AccessDenied } from '@/components/sharing/AccessDenied';
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
    return <AccessDenied />;
  }

  return <EditorLayout document={data.document} />;
}
