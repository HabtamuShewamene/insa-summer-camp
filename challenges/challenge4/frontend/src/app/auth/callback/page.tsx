'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [searchParams, setTokens, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Shield className="h-12 w-12 text-primary animate-pulse" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
