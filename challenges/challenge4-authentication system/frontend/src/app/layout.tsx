import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CollaborationProvider } from '@/lib/collaboration-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Identity Platform',
  description: 'Secure authentication and identity management system',
};

import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <CollaborationProvider>
                {children}
              </CollaborationProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
