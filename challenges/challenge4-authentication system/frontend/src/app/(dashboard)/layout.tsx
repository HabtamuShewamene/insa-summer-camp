'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDocumentEditor = pathname?.includes('/documents/');

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader />
        <main className={`flex-1 flex flex-col ${!isDocumentEditor ? 'max-w-5xl mx-auto w-full px-4 md:px-0 py-8' : ''}`}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
