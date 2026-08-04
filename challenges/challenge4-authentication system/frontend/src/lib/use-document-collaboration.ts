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

/**
 * Hook for managing real-time collaboration on a specific document.
 * Handles joining/leaving the collaboration room and provides the Yjs document.
 */
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
  
  const providerRef = useRef<SocketIOProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  // Generate a consistent color for the user
  const getUserColor = useCallback(() => {
    if (!user?.id) return '#6B7280'; // gray-500 as fallback
    
    const colors = [
      '#EF4444', // red-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
    ];
    
    // Use user ID to consistently pick a color
    const hash = user.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }, [user?.id]);

  // Initialize or cleanup collaboration
  useEffect(() => {
    if (!enabled || !socket || !isConnected || !documentId || !user) {
      // Cleanup if conditions are not met
      if (providerRef.current) {
        console.log('[useDocumentCollaboration] Cleaning up provider');
        providerRef.current.destroy();
        providerRef.current = null;
        setProvider(null);
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
        setYdoc(null);
      }
      setIsSynced(false);
      return;
    }

    try {
      console.log('[useDocumentCollaboration] Initializing collaboration for document:', documentId);
      
      // Create new Yjs document
      const newYdoc = new Y.Doc();
      ydocRef.current = newYdoc;
      setYdoc(newYdoc);

      // Create provider to sync with backend
      const newProvider = new SocketIOProvider(
        socket,
        documentId,
        newYdoc,
        {
          name: user.name || 'Anonymous',
          color: getUserColor(),
        }
      );
      
      providerRef.current = newProvider;
      setProvider(newProvider);

      // Check sync status
      const checkSync = setInterval(() => {
        if (newProvider.isSynced && !isSynced) {
          setIsSynced(true);
          onSynced?.();
        }
      }, 100);

      // Cleanup function
      return () => {
        console.log('[useDocumentCollaboration] Cleaning up collaboration');
        clearInterval(checkSync);
        
        if (providerRef.current) {
          providerRef.current.destroy();
          providerRef.current = null;
        }
        
        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }
        
        setProvider(null);
        setYdoc(null);
        setIsSynced(false);
      };
    } catch (error) {
      console.error('[useDocumentCollaboration] Error initializing collaboration:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
      return;
    }
  }, [socket, isConnected, documentId, enabled, user, getUserColor, onSynced, onError, isSynced]);

  const isCollaborating = isConnected && isSynced && activeUsers.length > 1;

  return {
    ydoc,
    provider,
    isSynced,
    activeUsers,
    isCollaborating,
  };
}
