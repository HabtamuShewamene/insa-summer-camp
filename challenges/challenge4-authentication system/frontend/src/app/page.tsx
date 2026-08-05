'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Users, Zap, Shield } from 'lucide-react';

// Landing page — ALWAYS shown at "/", regardless of auth state.
// Authenticated users can still see this page before going to dashboard.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Header ── */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black dark:bg-white">
                <FileText className="h-4 w-4 text-white dark:text-black" />
              </div>
              <span className="text-xl font-semibold">CollabDocs</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Built for INSA Summer Camp 2026
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
            Real-time document
            <br />
            <span className="text-gray-500 dark:text-gray-400">collaboration</span>
          </h1>

          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
            Create, edit, and collaborate on documents instantly.
            Multiple users, one document, zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto">
                Sign in to your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Real-time sync',
                description: 'Changes appear instantly for every collaborator. No refreshing, no conflicts.',
              },
              {
                icon: Users,
                title: 'Multi-user editing',
                description: 'See who is editing live. Share with Viewer, Commenter, or Editor permissions.',
              },
              {
                icon: Shield,
                title: 'Secure & versioned',
                description: 'Full version history with one-click restore. Your work is always safe.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-start p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 mb-4">
                  <Icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature list ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Everything you need
          </h2>
          <p className="text-gray-500 dark:text-gray-400">All features included, no plan limits.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            'Rich text editor', 'Real-time collaboration', 'Version history',
            'Inline comments', 'Document sharing', 'Permission levels',
            'Auto-save', 'Google OAuth', 'Dark mode', 'Export to Markdown',
            'Export to PDF', 'Presence awareness',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500 font-bold text-xs">✓</span>
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gray-900 dark:bg-black rounded-2xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to collaborate?
            </h2>
            <p className="text-gray-400 mb-8 text-base sm:text-lg max-w-xl mx-auto">
              Create your free account and start editing documents with your team in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base w-full sm:w-auto">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto border-gray-700 text-gray-300 hover:text-white hover:border-gray-500">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-black dark:bg-white">
              <FileText className="h-3.5 w-3.5 text-white dark:text-black" />
            </div>
            <span className="text-sm font-medium">CollabDocs</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 CollabDocs · INSA Summer Camp Challenge
          </p>
        </div>
      </footer>
    </div>
  );
}
