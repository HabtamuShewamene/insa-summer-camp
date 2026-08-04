'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { useCollaboration, CollaborationUser } from './collaboration-context';
import { SocketIOProvider } from './yjs-socket-provider';
import { useAuth } from './auth-context';

interface UseDocumentCollaborationOptions {
  documentId: string;
  enabled?: boolean;
  onSynced?: () => void;
  onError?: (error: Error) => void;
}

interface UseDocumentCollaborationReturn {
  ydoc: Y.Doc | null;
  provider: SocketIOProvider | null;
  isSynced: boolean;
  activeUsers: CollaborationUser[];
  isCollaborating: boolean;
}

export function useDocumentCollaboration({
  documentId,
  enabled = true,
  onSynced,
  onError,
}: UseDocumentCollaborationOptions): UseDocumentCollaborationReturn {
  const { socket, isConnected, activeUsers } = useCollaboration();
  const { user } = useAuth();

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SocketIOProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // Keep stable refs so callbacks inside the effect never go stale
  const providerRef = useRef<SocketIOProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const onSyncedRef = useRef(onSynced);
  const onErrorRef = useRef(onError);
  onSyncedRef.current = onSynced;
  onErrorRef.current = onError;

  const getUserColor = useCallback(() => {
    if (!user?.id) return '#6B7280';
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
    ];
    const hash = user.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }, [user?.id]);

  useEffect(() => {
    // Guard: only initialize when all dependencies are truly ready
    if (!enabled || !socket || !isConnected || !documentId || !user) {
      return;
    }

    // Avoid re-initializing if already set up for this document
    if (providerRef.current || ydocRef.current) {
      return;
    }

    try {
      const newYdoc = new Y.Doc();
      ydocRef.current = newYdoc;

      const newProvider = new SocketIOProvider(socket, documentId, newYdoc, {
        name: user.name || 'Anonymous',
        color: getUserColor(),
      });
      providerRef.current = newProvider;

      // Poll for sync completion — use ref so this closure never re-runs the outer effect
      const checkSync = setInterval(() => {
        if (providerRef.current?.isSynced) {
          clearInterval(checkSync);
          setIsSynced(true);
          onSyncedRef.current?.();
        }
      }, 150);

      // Flush state in a microtask to avoid batched-state issues
      Promise.resolve().then(() => {
        setYdoc(newYdoc);
        setProvider(newProvider);
      });

      return () => {
        clearInterval(checkSync);
        providerRef.current?.destroy();
        providerRef.current = null;
        ydocRef.current?.destroy();
        ydocRef.current = null;
        setProvider(null);
        setYdoc(null);
        setIsSynced(false);
      };
    } catch (error) {
      onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)));
    }
    // ⚠️ Intentionally omit onSynced/onError — they are accessed via stable refs.
    // isSynced is intentionally NOT in the deps to avoid re-initializing on every sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, documentId, enabled, user, getUserColor]);

  const isCollaborating = isConnected && isSynced && activeUsers.length > 1;

  return { ydoc, provider, isSynced, activeUsers, isCollaborating };
}
