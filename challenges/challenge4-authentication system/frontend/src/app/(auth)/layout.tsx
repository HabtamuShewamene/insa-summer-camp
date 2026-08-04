'use client';

import { PublicRoute } from '@/components/protected-route';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 md:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </PublicRoute>
  );
}
