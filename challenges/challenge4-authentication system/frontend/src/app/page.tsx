'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Users, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth or if authenticated
  if (isLoading || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-semibold">CollabDocs</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Document collaboration
            <br />
            made simple
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Create, edit, and collaborate on documents in real-time. Built for teams who value simplicity and speed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning fast</h3>
            <p className="text-gray-600">
              Real-time collaboration with zero lag. See changes as they happen.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Team collaboration</h3>
            <p className="text-gray-600">
              Share documents with teammates and work together seamlessly.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & private</h3>
            <p className="text-gray-600">
              Your documents are encrypted and protected with enterprise-grade security.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gray-900 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join thousands of teams using CollabDocs for their document collaboration.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Create your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2026 CollabDocs. Built for INSA Summer Camp.
            </p>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">CollabDocs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
