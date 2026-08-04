'use client';

import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        You do not have permission to view or edit this document. Please request access from the document owner.
      </p>
      <Button asChild size="sm">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
