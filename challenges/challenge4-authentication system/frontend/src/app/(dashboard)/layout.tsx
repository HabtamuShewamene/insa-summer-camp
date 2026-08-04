'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/20">
        <DashboardHeader />
        <main className="container mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
