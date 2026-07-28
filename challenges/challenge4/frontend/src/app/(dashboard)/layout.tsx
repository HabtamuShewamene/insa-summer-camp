'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <main className="container mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
