'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PermissionSelector } from './PermissionSelector';
import { SharedUsersList } from './SharedUsersList';
import { DocumentPermissionItem, PermissionLevel, sharingService } from '@/lib/sharing.service';
import { useAuth } from '@/lib/auth-context';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function ShareDialog({
  documentId,
  documentTitle,
  isOpen,
  onClose,
  isOwner,
}: ShareDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('EDITOR');
  const [permissionsList, setPermissionsList] = useState<DocumentPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPermissions = async () => {
    if (!isOpen || !documentId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await sharingService.getPermissions(documentId);
      setPermissionsList(list);
    } catch (err: any) {
      console.error('Failed to load permissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [isOpen, documentId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      await sharingService.shareDocument(documentId, email.trim(), permission);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      await fetchPermissions();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'User not found or failed to share');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePermission = async (permissionId: string, level: PermissionLevel) => {
    try {
      await sharingService.updatePermission(documentId, permissionId, level);
      await fetchPermissions();
    } catch (err: any) {
      setError('Failed to update permission');
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      await sharingService.removePermission(documentId, permissionId);
      await fetchPermissions();
    } catch (err: any) {
      setError('Failed to remove user access');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Share &quot;{documentTitle}&quot;
          </DialogTitle>
          <DialogDescription className="text-xs">
            Invite team members or collaborators by email and assign permissions.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleShare} className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter colleague's email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs h-9 flex-1"
                required
              />
              <PermissionSelector value={permission} onChange={setPermission} />
            </div>
            <Button type="submit" disabled={submitting || !email} size="sm" className="w-full text-xs font-medium h-9">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Send Invitation
            </Button>
          </form>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-200 rounded-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border mt-2">
          <h4 className="text-xs font-semibold mb-2">People with access</h4>
          {loading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SharedUsersList
              permissions={permissionsList}
              currentUserId={user?.id || ''}
              isOwner={isOwner}
              onUpdatePermission={handleUpdatePermission}
              onRemovePermission={handleRemovePermission}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
