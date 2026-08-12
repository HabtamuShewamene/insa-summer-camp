'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus, FileText, Clock, Users,
  MoreHorizontal, Pencil, Trash2, Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { documentService } from '@/lib/document.service';
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Doc {
  id: string;
  title: string;
  updatedAt: string;
  lastOpenedAt?: string | null;
  ownerId?: string;
  owner?: { id: string; name: string };
  permissions?: { permission: string }[];
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name}`;
}

// ── Inline rename input ──────────────────────────────────────────────────────
function RenameInput({
  id,
  initialTitle,
  onDone,
}: {
  id: string;
  initialTitle: string;
  onDone: (newTitle: string) => void;
}) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = async () => {
    const trimmed = value.trim() || 'Untitled Document';
    try {
      await documentService.renameDocument(id, trimmed);
    } catch { /* ignore */ }
    onDone(trimmed);
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onDone(initialTitle);
      }}
      className="text-sm font-medium bg-background border border-ring rounded px-1 w-full outline-none"
      onClick={(e) => e.preventDefault()}
    />
  );
}

// ── Single document row ──────────────────────────────────────────────────────
function DocRow({
  doc,
  onDelete,
  onRename,
  onDuplicate,
}: {
  doc: Doc;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (doc: Doc) => void;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.title || 'Untitled Document'}"?`)) return;
    setDeleting(true);
    try {
      await documentService.deleteDocument(doc.id);
      onDelete(doc.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await documentService.duplicateDocument(doc.id);
      onDuplicate(res.document as Doc);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
      onClick={() => !renaming && router.push(`/documents/${doc.id}`)}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        {renaming ? (
          <RenameInput
            id={doc.id}
            initialTitle={doc.title}
            onDone={(newTitle) => {
              setRenaming(false);
              onRename(doc.id, newTitle);
            }}
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">
              {doc.title || 'Untitled Document'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isMounted ? `Edited ${formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}` : 'Loading date...'}
            </p>
          </>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => router.push(`/documents/${doc.id}`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRenaming(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate} disabled={duplicating}>
            <Copy className="h-3.5 w-3.5 mr-2" />
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
    </div>
  );
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
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

// ── Empty state ───────────────────────────────────────────────────────────────
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
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Document panel ────────────────────────────────────────────────────────────
function DocPanel({
  icon: Icon, title, docs, loading, onDelete, onRename, onDuplicate,
  action, emptyTitle, emptyDesc, emptyAction,
}: {
  icon: React.ElementType;
  title: string;
  docs: Doc[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (doc: Doc) => void;
  action?: React.ReactNode;
  emptyTitle: string;
  emptyDesc: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>
      <div className="flex-1 p-2 min-h-[220px]">
        {loading ? (
          <div className="space-y-0.5">
            {[1, 2, 3].map((i) => <DocSkeleton key={i} />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} action={emptyAction} />
        ) : (
          <div className="space-y-0.5">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onDelete={onDelete}
                onRename={onRename}
                onDuplicate={onDuplicate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [myDocs, setMyDocs] = useState<Doc[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Doc[]>([]);
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const [allRes, recentRes] = await Promise.all([
        documentService.getDocuments(),
        documentService.getRecentDocuments(),
      ]);
      const all: Doc[] = allRes.documents || [];
      setMyDocs(all.filter((d) => d.owner?.id === user.id || d.ownerId === user.id));
      setSharedDocs(all.filter((d) => d.owner?.id !== user.id && d.ownerId !== user.id));
      setRecentDocs((recentRes.documents || []).slice(0, 5));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

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
    setRecentDocs((p) => p.filter((d) => d.id !== id));
  };

  const handleRename = (id: string, title: string) => {
    const update = (docs: Doc[]) => docs.map((d) => d.id === id ? { ...d, title } : d);
    setMyDocs(update);
    setSharedDocs(update);
    setRecentDocs(update);
  };

  const handleDuplicate = (newDoc: Doc) => {
    setMyDocs((p) => [newDoc, ...p]);
  };

  const stats = [
    { icon: FileText, label: 'My documents',  value: loading ? '–' : String(myDocs.length) },
    { icon: Users,    label: 'Shared with me', value: loading ? '–' : String(sharedDocs.length) },
    { icon: Clock,    label: 'Recently opened', value: loading ? '–' : String(recentDocs.length) },
  ];

  const newDocBtn = (size: 'sm' | 'outline') => (
    <Button
      variant={size === 'outline' ? 'outline' : 'ghost'}
      size="sm"
      className={size === 'outline' ? 'h-8 text-xs' : 'h-7 text-xs gap-1 text-muted-foreground hover:text-foreground'}
      onClick={handleCreate}
      disabled={isCreating}
    >
      <Plus className="h-3 w-3 mr-1" />
      {isCreating ? 'Creating…' : 'New document'}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isMounted ? getGreeting(user.name?.split(' ')[0] || 'User') : 'Welcome'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isMounted ? new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            }) : 'Loading date...'}
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating} size="sm" className="h-8 px-3">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {isCreating ? 'Creating…' : 'New document'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
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

      {/* Top row: My documents + Shared with me */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocPanel
          icon={FileText} title="My documents"
          docs={myDocs} loading={loading}
          onDelete={handleDelete} onRename={handleRename} onDuplicate={handleDuplicate}
          action={myDocs.length > 0 ? newDocBtn('sm') : undefined}
          emptyTitle="No documents yet"
          emptyDesc="Create your first document to get started"
          emptyAction={newDocBtn('outline')}
        />
        <DocPanel
          icon={Users} title="Shared with me"
          docs={sharedDocs} loading={loading}
          onDelete={handleDelete} onRename={handleRename} onDuplicate={handleDuplicate}
          emptyTitle="No shared documents"
          emptyDesc="Documents shared with you will appear here"
        />
      </div>

      {/* Recently opened — full width */}
      <DocPanel
        icon={Clock} title="Recently opened"
        docs={recentDocs} loading={loading}
        onDelete={handleDelete} onRename={handleRename} onDuplicate={handleDuplicate}
        emptyTitle="No recent documents"
        emptyDesc="Documents you open will appear here"
      />
    </div>
  );
}
