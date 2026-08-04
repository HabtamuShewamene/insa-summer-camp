'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Wraps protected pages.
 * - While loading: shows spinner
 * - If no user after loading: redirects to /login
 * - If user present: renders children
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="h-14 border-b w-full flex items-center px-4 md:px-8">
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-6">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect in-flight — render nothing to avoid flash
    return null;
  }

  return <>{children}</>;
}

/**
 * Wraps public-only pages (login, register, forgot-password).
 * - While loading: shows spinner
 * - If user is logged in: redirects to /dashboard
 * - If no user: renders children
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Skeleton className="h-[500px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (user) {
    // Redirect in-flight
    return null;
  }

  return <>{children}</>;
}
