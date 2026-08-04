'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock, Users, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  if (!user) return null;

  const handleCreateDocument = async () => {
    setIsCreating(true);
    try {
      const response = await api.createDocument({ title: 'Untitled Document' });
      router.push(`/documents/${response.document.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Good morning, {user.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={handleCreateDocument} disabled={isCreating} className="h-9 px-4 shrink-0 transition-all active:scale-95">
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Creating...' : 'New document'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: 'Documents', value: '0' },
          { icon: Users, label: 'Shared with me', value: '0' },
          { icon: Clock, label: 'Recent', value: '0' }
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Recent documents
            </h2>
          </div>
          <div className="flex-1 rounded-xl border bg-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">Create your first document to get started</p>
            <Button onClick={handleCreateDocument} disabled={isCreating} variant="outline" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-2" />
              New document
            </Button>
          </div>
        </div>

        {/* Shared Documents */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Shared with me
            </h2>
          </div>
          <div className="flex-1 rounded-xl border bg-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">No shared documents</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">Documents shared with you will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
