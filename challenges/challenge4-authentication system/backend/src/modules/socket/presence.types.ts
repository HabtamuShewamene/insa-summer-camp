export enum UserStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  OFFLINE = 'offline',
}

export enum PresenceEvent {
  USER_JOINED = 'user-joined',
  USER_UPDATED = 'user-updated',
  USER_LEFT = 'user-left',
  CURSOR_MOVED = 'cursor-moved',
  USER_TYPING = 'user-typing',
  USER_IDLE = 'user-idle',
}

export interface UserPresence {
  id: string; // User database ID
  name: string;
  email: string;
  avatar?: string;
  color: string;
  socketId: string;
  status: UserStatus;
  lastActive: Date;
  joinedAt: Date;
}

export interface CursorPosition {
  from: number;
  to: number;
  head?: number;
  anchor?: number;
}

export interface UserAwareness {
  userId: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
}

export interface PresenceState {
  documentId: string;
  userId: string;
  socketId: string;
  status: UserStatus;
  joinedAt: Date;
  lastActivity: Date;
}

export interface TypingState {
  userId: string;
  name: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface DocumentPresence {
  documentId: string;
  users: Map<string, UserPresence>;
  typingUsers: Map<string, TypingState>;
}
