'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { setTokens as setApiTokens } from '@/lib/api';
import { Loader2 } from 'lucide-react';

/**
 * This page handles the OLD /auth/callback flow (direct token in URL).
 * The NEW flow goes through /api/set-auth (server-side cookie setting).
 * This page is kept as fallback.
 */
function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('Missing authentication tokens');
      setTimeout(() => { window.location.replace('/login?error=oauth_failed'); }, 2000);
      return;
    }

    // Store in memory + localStorage + cookie
    setApiTokens(accessToken, refreshToken);

    // Write cookie explicitly with long expiry + SameSite=Lax
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    // Wait for 2 animation frames so the browser flushes the cookie
    // before we trigger the navigation (which sends a new HTTP request
    // that Next.js middleware inspects)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.location.replace('/dashboard');
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-2">Sign-in failed</h2>
          <p className="text-sm text-muted-foreground mb-1">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-lg font-semibold mb-1">Completing sign in…</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
