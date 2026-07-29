'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const router = useRouter();
  const handled = useRef(false); // prevent double-execution in React Strict Mode

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken && refreshToken) {
      // await setTokens so user state is populated BEFORE we navigate
      setTokens(accessToken, refreshToken).then(() => {
        router.replace('/dashboard');
      });
    } else {
      router.replace('/login?error=oauth_missing_tokens');
    }
  }, [searchParams, setTokens, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Shield className="h-12 w-12 text-primary animate-pulse" />
      <p className="text-muted-foreground">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
