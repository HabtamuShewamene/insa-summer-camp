'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">500</h1>
          <h2 className="text-xl font-semibold">Internal Server Error</h2>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted p-4 rounded-lg text-left overflow-auto max-h-40">
            <code className="text-xs text-red-600">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}