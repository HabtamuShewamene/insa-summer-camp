'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus, FileText, Clock, Users,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { documentService } from '@/lib/document.service';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Doc {
  id: string;
  title: string;
  updatedAt: string;
  ownerId?: string;
  owner?: { id: string; name: string };
  permissions?: { permission: string }[];
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name}`;
}

// ── Single document row ──────────────────────────────────────────────────────
function DocRow({ doc, onDelete }: { doc: Doc; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title || 'Untitled Document'}"?`)) return;
    setDeleting(true);
    try {
      await documentService.deleteDocument(doc.id);
      onDelete(doc.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {doc.title || 'Untitled Document'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onSelect={() => router.push(`/documents/${doc.id}`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleDelete}
            disabled={deleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            {deleting ? 'Deleting…' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}

// ── Skeleton loader row ──────────────────────────────────────────────────────
function DocSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="h-7 w-7 rounded-md bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-2.5 bg-muted rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Document card panel ──────────────────────────────────────────────────────
function DocPanel({
  icon: Icon,
  title,
  docs,
  loading,
  onDelete,
  action,
  emptyTitle,
  emptyDesc,
  emptyAction,
}: {
  icon: React.ElementType;
  title: string;
  docs: Doc[];
  loading: boolean;
  onDelete: (id: string) => void;
  action?: React.ReactNode;
  emptyTitle: string;
  emptyDesc: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>

      {/* Panel body */}
      <div className="flex-1 p-2 min-h-[240px]">
        {loading ? (
          <div className="space-y-0.5">
            {[1, 2, 3].map((i) => <DocSkeleton key={i} />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={emptyTitle}
            description={emptyDesc}
            action={emptyAction}
          />
        ) : (
          <div className="space-y-0.5">
            {docs.map((doc) => (
              <DocRow key={doc.id} doc={doc} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [myDocs, setMyDocs] = useState<Doc[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const { documents } = await documentService.getDocuments();
      const all: Doc[] = documents || [];
      // Own = user is the owner
      setMyDocs(all.filter((d) => d.owner?.id === user.id || d.ownerId === user.id));
      // Shared = owned by someone else
      setSharedDocs(all.filter((d) => d.owner?.id !== user.id && d.ownerId !== user.id));
    } catch {
      // silently fail — empty state handles it
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (!user) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await api.createDocument({ title: 'Untitled Document' });
      router.push(`/documents/${res.document.id}`);
    } catch {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setMyDocs((p) => p.filter((d) => d.id !== id));
    setSharedDocs((p) => p.filter((d) => d.id !== id));
  };

  const stats = [
    {
      icon: FileText,
      label: 'My documents',
      value: loading ? '–' : String(myDocs.length),
    },
    {
      icon: Users,
      label: 'Shared with me',
      value: loading ? '–' : String(sharedDocs.length),
    },
    {
      icon: Clock,
      label: 'Total',
      value: loading ? '–' : String(myDocs.length + sharedDocs.length),
    },
  ];

  const newDocBtn = (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
      onClick={handleCreate}
      disabled={isCreating}
    >
      <Plus className="h-3 w-3" />
      New
    </Button>
  );

  const newDocOutlineBtn = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs"
      onClick={handleCreate}
      disabled={isCreating}
    >
      <Plus className="h-3.5 w-3.5 mr-1.5" />
      {isCreating ? 'Creating…' : 'New document'}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* ── Welcome row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {getGreeting(user.name?.split(' ')[0] || 'User')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating} size="sm" className="h-8 px-3">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {isCreating ? 'Creating…' : 'New document'}
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Document panels ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocPanel
          icon={FileText}
          title="Recent documents"
          docs={myDocs}
          loading={loading}
          onDelete={handleDelete}
          action={myDocs.length > 0 ? newDocBtn : undefined}
          emptyTitle="No documents yet"
          emptyDesc="Create your first document to get started"
          emptyAction={newDocOutlineBtn}
        />
        <DocPanel
          icon={Users}
          title="Shared with me"
          docs={sharedDocs}
          loading={loading}
          onDelete={handleDelete}
          emptyTitle="No shared documents"
          emptyDesc="Documents shared with you will appear here"
        />
      </div>
    </div>
  );
}
