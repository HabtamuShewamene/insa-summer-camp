'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

export type ConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnected' 
  | 'offline'
  | 'error';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  socketId: string;
}

interface CollaborationContextType {
  socket: Socket | null;
  status: ConnectionStatus;
  activeUsers: CollaborationUser[];
  isConnected: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection when user is authenticated
  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setStatus('disconnected');
      setActiveUsers([]);
      return;
    }

    // Get access token from localStorage
    const accessToken = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;

    if (!accessToken) {
      setStatus('offline');
      return;
    }

    // Create socket connection with JWT authentication
    setStatus('connecting');
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${accessToken}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      autoConnect: true,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[Collaboration] Socket connected:', newSocket.id);
      setStatus('connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Collaboration] Socket disconnected:', reason);
      setStatus('disconnected');
      setActiveUsers([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Collaboration] Connection error:', error.message);
      setStatus('error');
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('[Collaboration] Attempting to reconnect...');
      setStatus('reconnecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[Collaboration] Reconnected after', attemptNumber, 'attempts');
      setStatus('connected');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[Collaboration] Reconnection error:', error.message);
      setStatus('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[Collaboration] Reconnection failed');
      setStatus('offline');
    });

    // Room users event (received when someone joins/leaves)
    newSocket.on('room-users', (users: CollaborationUser[]) => {
      console.log('[Collaboration] Room users updated:', users);
      setActiveUsers(users);
    });

    // User joined event
    newSocket.on('user-joined', (user: CollaborationUser) => {
      console.log('[Collaboration] User joined:', user.name);
      setActiveUsers((prev) => {
        // Avoid duplicates
        if (prev.some(u => u.socketId === user.socketId)) {
          return prev;
        }
        return [...prev, user];
      });
    });

    // User left event
    newSocket.on('user-left', ({ socketId }: { socketId: string }) => {
      console.log('[Collaboration] User left:', socketId);
      setActiveUsers((prev) => prev.filter(u => u.socketId !== socketId));
    });

    // Error event from server
    newSocket.on('error', (data: { message: string }) => {
      console.error('[Collaboration] Server error:', data.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      console.log('[Collaboration] Cleaning up socket connection');
      newSocket.disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  const isConnected = status === 'connected';

  return (
    <CollaborationContext.Provider
      value={{
        socket,
        status,
        activeUsers,
        isConnected,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}
