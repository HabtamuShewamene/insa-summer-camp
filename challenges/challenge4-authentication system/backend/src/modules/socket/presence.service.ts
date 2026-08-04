import { Injectable, Logger } from '@nestjs/common';
import {
  UserPresence,
  UserStatus,
  PresenceState,
  TypingState,
  DocumentPresence,
} from './presence.types';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  
  // documentId -> DocumentPresence
  private documentPresence: Map<string, DocumentPresence> = new Map();
  
  // socketId -> documentId (for quick lookup)
  private socketToDocument: Map<string, string> = new Map();
  
  // Track typing timeouts
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Idle timeout duration (60 seconds)
  private readonly IDLE_TIMEOUT = 60000;
  
  // Typing indicator duration (3 seconds)
  private readonly TYPING_TIMEOUT = 3000;

  /**
   * Add user to document presence
   */
  addUser(
    documentId: string,
    userId: string,
    socketId: string,
    userData: { name: string; email: string; color: string; avatar?: string },
  ): UserPresence {
    if (!this.documentPresence.has(documentId)) {
      this.documentPresence.set(documentId, {
        documentId,
        users: new Map(),
        typingUsers: new Map(),
      });
    }

    const presence = this.documentPresence.get(documentId)!;
    const now = new Date();

    const userPresence: UserPresence = {
      id: userId,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      color: userData.color,
      socketId,
      status: UserStatus.ONLINE,
      lastActive: now,
      joinedAt: now,
    };

    presence.users.set(socketId, userPresence);
    this.socketToDocument.set(socketId, documentId);

    this.logger.log(
      `User ${userData.name} joined presence for document ${documentId}`,
    );

    return userPresence;
  }

  /**
   * Remove user from document presence
   */
  removeUser(socketId: string): UserPresence | null {
    const documentId = this.socketToDocument.get(socketId);
    if (!documentId) return null;

    const presence = this.documentPresence.get(documentId);
    if (!presence) return null;

    const userPresence = presence.users.get(socketId);
    if (!userPresence) return null;

    presence.users.delete(socketId);
    presence.typingUsers.delete(userPresence.id);
    this.socketToDocument.delete(socketId);

    // Clear typing timeout if exists
    const typingKey = `${documentId}-${userPresence.id}`;
    const timeout = this.typingTimeouts.get(typingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(typingKey);
    }

    // Clean up empty documents
    if (presence.users.size === 0) {
      this.documentPresence.delete(documentId);
    }

    this.logger.log(
      `User ${userPresence.name} left presence for document ${documentId}`,
    );

    return userPresence;
  }

  /**
   * Update user activity timestamp
   */
  updateActivity(socketId: string): void {
    const documentId = this.socketToDocument.get(socketId);
    if (!documentId) return;

    const presence = this.documentPresence.get(documentId);
    if (!presence) return;

    const userPresence = presence.users.get(socketId);
    if (!userPresence) return;

    userPresence.lastActive = new Date();

    // If user was idle, set back to online
    if (userPresence.status === UserStatus.IDLE) {
      userPresence.status = UserStatus.ONLINE;
    }
  }

  /**
   * Set user as typing
   */
  setUserTyping(socketId: string, isTyping: boolean): TypingState | null {
    const documentId = this.socketToDocument.get(socketId);
    if (!documentId) return null;

    const presence = this.documentPresence.get(documentId);
    if (!presence) return null;

    const userPresence = presence.users.get(socketId);
    if (!userPresence) return null;

    const typingKey = `${documentId}-${userPresence.id}`;
    const existingTimeout = this.typingTimeouts.get(typingKey);

    if (isTyping) {
      // Set typing state
      const typingState: TypingState = {
        userId: userPresence.id,
        name: userPresence.name,
        isTyping: true,
        timestamp: new Date(),
      };
      presence.typingUsers.set(userPresence.id, typingState);

      // Clear existing timeout
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set timeout to clear typing after 3 seconds
      const timeout = setTimeout(() => {
        presence.typingUsers.delete(userPresence.id);
        this.typingTimeouts.delete(typingKey);
      }, this.TYPING_TIMEOUT);

      this.typingTimeouts.set(typingKey, timeout);

      return typingState;
    } else {
      // Clear typing state
      presence.typingUsers.delete(userPresence.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeouts.delete(typingKey);
      }
      return null;
    }
  }

  /**
   * Get all users in document
   */
  getUsersInDocument(documentId: string): UserPresence[] {
    const presence = this.documentPresence.get(documentId);
    if (!presence) return [];
    return Array.from(presence.users.values());
  }

  /**
   * Get typing users in document
   */
  getTypingUsers(documentId: string): TypingState[] {
    const presence = this.documentPresence.get(documentId);
    if (!presence) return [];
    return Array.from(presence.typingUsers.values());
  }

  /**
   * Update user status (online, idle, offline)
   */
  updateUserStatus(socketId: string, status: UserStatus): UserPresence | null {
    const documentId = this.socketToDocument.get(socketId);
    if (!documentId) return null;

    const presence = this.documentPresence.get(documentId);
    if (!presence) return null;

    const userPresence = presence.users.get(socketId);
    if (!userPresence) return null;

    userPresence.status = status;
    userPresence.lastActive = new Date();

    return userPresence;
  }

  /**
   * Check for idle users and update their status
   */
  checkIdleUsers(): void {
    const now = Date.now();

    for (const presence of this.documentPresence.values()) {
      for (const user of presence.users.values()) {
        const timeSinceActivity = now - user.lastActive.getTime();

        if (
          timeSinceActivity > this.IDLE_TIMEOUT &&
          user.status === UserStatus.ONLINE
        ) {
          user.status = UserStatus.IDLE;
          this.logger.debug(`User ${user.name} is now idle`);
        }
      }
    }
  }

  /**
   * Get document ID by socket ID
   */
  getDocumentId(socketId: string): string | undefined {
    return this.socketToDocument.get(socketId);
  }

  /**
   * Get user presence by socket ID
   */
  getUserPresence(socketId: string): UserPresence | null {
    const documentId = this.socketToDocument.get(socketId);
    if (!documentId) return null;

    const presence = this.documentPresence.get(documentId);
    if (!presence) return null;

    return presence.users.get(socketId) || null;
  }

  /**
   * Get all document IDs with active presence
   */
  getActiveDocuments(): string[] {
    return Array.from(this.documentPresence.keys());
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.typingTimeouts.clear();
    this.documentPresence.clear();
    this.socketToDocument.clear();
  }
}
