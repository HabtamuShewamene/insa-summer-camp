'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCollaboration } from './collaboration-context';
import { debounce } from 'lodash';

interface UsePresenceTrackingOptions {
  documentId: string;
  enabled?: boolean;
  typingThreshold?: number; // ms between keystrokes to consider "typing"
  activityThreshold?: number; // ms between activity updates to server
}

/**
 * Hook to track user presence activity (typing, mouse movement, editor changes)
 * and emit appropriate events to the collaboration server
 */
export function usePresenceTracking({
  documentId,
  enabled = true,
  typingThreshold = 1000,
  activityThreshold = 5000,
}: UsePresenceTrackingOptions) {
  const { socket, isConnected } = useCollaboration();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Debounced activity update to server
  const debouncedActivityUpdate = useRef(
    debounce(() => {
      if (socket && isConnected && documentId) {
        socket.emit('user-activity', { documentId });
        lastActivityRef.current = Date.now();
      }
    }, activityThreshold)
  ).current;

  // Emit typing event
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (socket && isConnected && documentId) {
        socket.emit('user-typing', { documentId, isTyping });
        isTypingRef.current = isTyping;
      }
    },
    [socket, isConnected, documentId]
  );

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!enabled || !socket || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If not already typing, emit typing started
    if (!isTypingRef.current) {
      emitTyping(true);
    }

    // Set timeout to clear typing after threshold
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, typingThreshold);

    // Update activity
    debouncedActivityUpdate();
  }, [enabled, socket, isConnected, emitTyping, typingThreshold, debouncedActivityUpdate]);

  // Handle general activity (mouse, selection, etc.)
  const handleActivity = useCallback(() => {
    if (!enabled || !socket || !isConnected) return;
    debouncedActivityUpdate();
  }, [enabled, socket, isConnected, debouncedActivityUpdate]);

  // Track keyboard input
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeydown = (e: KeyboardEvent) => {
      // Only track actual typing keys (not Ctrl, Alt, etc.)
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1
      ) {
        handleTyping();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [enabled, handleTyping]);

  // Track mouse activity
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleMouseMove = debounce(() => {
      handleActivity();
    }, 1000);

    const handleClick = () => {
      handleActivity();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      handleMouseMove.cancel();
    };
  }, [enabled, handleActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        emitTyping(false);
      }
      debouncedActivityUpdate.cancel();
    };
  }, [emitTyping, debouncedActivityUpdate]);

  return {
    handleTyping,
    handleActivity,
  };
}
