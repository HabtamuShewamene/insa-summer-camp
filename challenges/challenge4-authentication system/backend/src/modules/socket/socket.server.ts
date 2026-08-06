import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  ConnectedSocket, 
  MessageBody 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import { DocumentRoomService, RoomUser } from './document.room';
import { PresenceService } from './presence.service';
import { UserStatus, PresenceEvent } from './presence.types';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SocketServer implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketServer.name);
  private idleCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly syncService: SyncService,
    private readonly roomService: DocumentRoomService,
    private readonly presenceService: PresenceService,
    private readonly prisma: PrismaService,
  ) {
    // Check for idle users every 30 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleUsers();
    }, 30000);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.query.token;
      if (!token) throw new Error('No token provided');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('User not found');

      client.data.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      this.logger.log(`Client connected: ${client.id} (User: ${user.name})`);
    } catch (error) {
      this.logger.error(`Connection rejected for ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const documentId = this.roomService.getUserRoom(client.id);
    if (documentId) {
      const user = this.roomService.removeUser(documentId, client.id);
      const userPresence = this.presenceService.removeUser(client.id);
      
      if (user) {
        client.to(documentId).emit('user-left', { userId: user.id, socketId: client.id });
        const users = this.roomService.getUsersInRoom(documentId);
        this.server.to(documentId).emit('room-users', users);
        
        // Send updated presence
        if (userPresence) {
          this.server.to(documentId).emit(PresenceEvent.USER_LEFT, {
            userId: userPresence.id,
            socketId: client.id,
          });
          this.broadcastPresence(documentId);
        }
        
        // Clean up Yjs memory if room is empty
        this.syncService.removeDocIfEmpty(documentId, users.length);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, color?: string }
  ) {
    const { documentId, color } = data;
    const user = client.data.user;

    // Guard: reject if documentId is missing or not a valid UUID
    if (!documentId || typeof documentId !== 'string' || documentId.trim() === '' || documentId === 'undefined') {
      client.emit('error', { message: 'Invalid document ID' });
      return;
    }

    // Verify document exists and user has access
    const doc = await this.prisma.document.findUnique({ 
      where: { id: documentId },
      select: { id: true, ownerId: true, isDeleted: true }
    });
    
    if (!doc || doc.isDeleted) {
      client.emit('error', { message: 'Document not found or inaccessible' });
      return;
    }

    // Resolve user permission level
    let permission: string | null = null;
    if (doc.ownerId === user.id) {
      permission = 'OWNER';
    } else {
      const permRecord = await this.prisma.documentPermission.findUnique({
        where: { documentId_userId: { documentId, userId: user.id } },
      });
      permission = permRecord?.permission ?? null;
    }

    if (!permission) {
      client.emit('error', { message: 'Unauthorized access to document' });
      return;
    }

    client.data.permission = permission;
    client.join(documentId);
    
    // Emit user permission to client
    client.emit('permission-info', { permission });
    
    const userColor = color || this.generateUserColor(user.id);
    
    const roomUser: RoomUser = {
      id: user.id,
      name: user.name,
      socketId: client.id,
      color: userColor,
    };
    this.roomService.addUser(documentId, roomUser);

    // Add to presence tracking
    const userPresence = this.presenceService.addUser(
      documentId,
      user.id,
      client.id,
      {
        name: user.name,
        email: user.email,
        color: userColor,
      },
    );

    // Notify others in room
    client.to(documentId).emit('user-joined', roomUser);
    
    // Send current active users
    const users = this.roomService.getUsersInRoom(documentId);
    this.server.to(documentId).emit('room-users', users);

    // Send presence notification
    this.server.to(documentId).emit(PresenceEvent.USER_JOINED, {
      user: userPresence,
    });

    // Send current presence to the joining user
    this.broadcastPresence(documentId);

    // Synchronize Yjs state — if server doc is empty, seed from DB content
    const yDoc = this.syncService.getDoc(documentId);
    const isEmpty = Y.encodeStateAsUpdate(yDoc).length <= 2; // only header bytes = empty

    if (isEmpty) {
      // Load persisted content from database and seed the Yjs doc
      const dbContent = await this.prisma.documentContent.findUnique({
        where: { documentId },
        select: { content: true },
      });

      if (dbContent?.content) {
        try {
          // Insert saved content as a ProseMirror fragment into the Yjs XmlFragment
          // so the Collaboration extension picks it up immediately
          const fragment = yDoc.getXmlFragment('default');
          if (fragment.length === 0) {
            // Parse ProseMirror JSON and insert as text nodes
            const content = dbContent.content as any;
            if (content?.content && Array.isArray(content.content)) {
              // We encode the DB content as a Yjs update using prosemirror-model
              // Instead, we send the raw JSON to the client and let it initialise
              client.emit('load-content', { content: dbContent.content });
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to seed Yjs from DB for ${documentId}: ${e}`);
        }
      }
    }

    const stateVector = this.syncService.getStateVector(documentId);
    client.emit('sync-step-1', stateVector);
    
    const update = this.syncService.getUpdate(documentId);
    client.emit('document-update', update);

    this.logger.log(`User ${user.name} joined document ${documentId}`);
  }

  @SubscribeMessage('leave-document')
  handleLeaveDocument(@ConnectedSocket() client: Socket, @MessageBody() data: { documentId: string }) {
    const { documentId } = data;
    client.leave(documentId);
    const user = this.roomService.removeUser(documentId, client.id);
    const userPresence = this.presenceService.removeUser(client.id);
    
    if (user) {
      client.to(documentId).emit('user-left', { userId: user.id, socketId: client.id });
      const users = this.roomService.getUsersInRoom(documentId);
      this.server.to(documentId).emit('room-users', users);
      
      if (userPresence) {
        this.server.to(documentId).emit(PresenceEvent.USER_LEFT, {
          userId: userPresence.id,
          socketId: client.id,
        });
        this.broadcastPresence(documentId);
      }
      
      this.syncService.removeDocIfEmpty(documentId, users.length);
    }
  }

  @SubscribeMessage('document-update')
  handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, update: Uint8Array }
  ) {
    const { documentId, update } = data;
    
    // Block editing if user is VIEWER or COMMENTER
    const permission = client.data.permission;
    if (permission === 'VIEWER' || permission === 'COMMENTER') {
      client.emit('error', { message: 'Read-only access: content updates not allowed' });
      return;
    }

    // Update activity
    this.presenceService.updateActivity(client.id);
    
    // Convert Buffer/array to Uint8Array if necessary
    const updateArray = new Uint8Array(update);

    // Apply to server Y.Doc
    this.syncService.applyUpdate(documentId, updateArray);

    // Broadcast to others in room
    client.to(documentId).emit('document-update', updateArray);
  }

  @SubscribeMessage('sync-step-1')
  handleSyncStep1(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, stateVector: Uint8Array }
  ) {
    const { documentId, stateVector } = data;
    const sv = new Uint8Array(stateVector);
    const update = this.syncService.getUpdate(documentId, sv);
    client.emit('sync-step-2', update);
  }

  @SubscribeMessage('sync-step-2')
  handleSyncStep2(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, update: Uint8Array }
  ) {
    const { documentId, update } = data;
    const updateArray = new Uint8Array(update);
    this.syncService.applyUpdate(documentId, updateArray);
    client.to(documentId).emit('document-update', updateArray);
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, update: Uint8Array }
  ) {
    // Update activity on awareness changes (cursor movement, selection)
    this.presenceService.updateActivity(client.id);
    client.to(data.documentId).emit('awareness-update', new Uint8Array(data.update));
  }

  @SubscribeMessage('user-typing')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, isTyping: boolean }
  ) {
    const { documentId, isTyping } = data;
    const typingState = this.presenceService.setUserTyping(client.id, isTyping);
    
    if (typingState) {
      // Broadcast typing state to others in room
      client.to(documentId).emit(PresenceEvent.USER_TYPING, {
        userId: typingState.userId,
        name: typingState.name,
        isTyping: typingState.isTyping,
      });
    }
  }

  @SubscribeMessage('user-activity')
  handleUserActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string }
  ) {
    this.presenceService.updateActivity(client.id);
  }

  /**
   * Comment-related Socket.IO events
   */
  
  /**
   * Broadcast comment created event to document room
   */
  broadcastCommentCreated(documentId: string, comment: any): void {
    this.server.to(documentId).emit('comment-created', comment);
    this.logger.log(`Comment created broadcast to document ${documentId}`);
  }

  /**
   * Broadcast comment updated event to document room
   */
  broadcastCommentUpdated(documentId: string, comment: any): void {
    this.server.to(documentId).emit('comment-updated', comment);
    this.logger.log(`Comment updated broadcast to document ${documentId}`);
  }

  /**
   * Broadcast comment deleted event to document room
   */
  broadcastCommentDeleted(documentId: string, commentId: string): void {
    this.server.to(documentId).emit('comment-deleted', { commentId });
    this.logger.log(`Comment deleted broadcast to document ${documentId}`);
  }

  /**
   * Broadcast comment resolved event to document room
   */
  broadcastCommentResolved(documentId: string, comment: any): void {
    this.server.to(documentId).emit('comment-resolved', comment);
    this.logger.log(`Comment resolved broadcast to document ${documentId}`);
  }

  /**
   * Broadcast comment reopened event to document room
   */
  broadcastCommentReopened(documentId: string, comment: any): void {
    this.server.to(documentId).emit('comment-reopened', comment);
    this.logger.log(`Comment reopened broadcast to document ${documentId}`);
  }

  /**
   * Broadcast reply added event to document room
   */
  broadcastReplyAdded(documentId: string, reply: any): void {
    this.server.to(documentId).emit('reply-added', reply);
    this.logger.log(`Reply added broadcast to document ${documentId}`);
  }

  /**
   * Broadcast reply deleted event to document room
   */
  broadcastReplyDeleted(documentId: string, replyId: string, commentId: string): void {
    this.server.to(documentId).emit('reply-deleted', { replyId, commentId });
    this.logger.log(`Reply deleted broadcast to document ${documentId}`);
  }

  broadcastVersionCreated(documentId: string, version: any): void {
    this.server.to(documentId).emit('version-created', version);
    this.logger.log(`Version created broadcast to document ${documentId}`);
  }

  broadcastVersionRestored(documentId: string, version: any): void {
    this.server.to(documentId).emit('version-restored', version);
    this.logger.log(`Version restored broadcast to document ${documentId}`);
  }

  broadcastDocumentRestored(documentId: string, payload: any): void {
    this.server.to(documentId).emit('document-restored', payload);
    this.logger.log(`Document restored broadcast to document ${documentId}`);
  }

  async broadcastDocumentShared(userId: string, payload: any): Promise<void> {
    const title = 'Document Shared';
    const message = `You were given access to ${payload.documentTitle || 'a document'}.`;
    const link = payload.documentId ? `/documents/${payload.documentId}` : undefined;
    
    // Persist to DB
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
      },
    });

    this.server.emit(`user-notification:${userId}`, {
      type: 'document-shared',
      title,
      message,
      link,
      ...payload,
    });
    this.logger.log(`Document shared broadcast to user ${userId}`);
  }

  broadcastPermissionUpdated(documentId: string, payload: any): void {
    this.server.to(documentId).emit('permission-updated', payload);
    this.logger.log(`Permission updated broadcast for document ${documentId}`);
  }

  broadcastPermissionRemoved(documentId: string, payload: any): void {
    this.server.to(documentId).emit('permission-removed', payload);
    this.logger.log(`Permission removed broadcast for document ${documentId}`);
  }

  async broadcastDocumentAccessRevoked(userId: string, payload: any): Promise<void> {
    const title = 'Access Revoked';
    const message = `Your access to ${payload.documentTitle || 'a document'} has been revoked.`;
    
    // Persist to DB
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    this.server.emit(`user-notification:${userId}`, {
      type: 'access-revoked',
      title,
      message,
      ...payload,
    });
    this.logger.log(`Document access revoked broadcast to user ${userId}`);
  }

  broadcastDocumentUpdate(documentId: string, update: number[]): void {
    this.server.to(documentId).emit('document-update', update);
    this.logger.log(`Document update broadcast to document ${documentId}`);
  }

  /**
   * Broadcast current presence to all users in document
   */
  private broadcastPresence(documentId: string): void {
    const users = this.presenceService.getUsersInDocument(documentId);
    const typingUsers = this.presenceService.getTypingUsers(documentId);
    
    this.server.to(documentId).emit('presence-update', {
      users,
      typingUsers,
    });
  }

  /**
   * Check for idle users periodically
   */
  private checkIdleUsers(): void {
    this.presenceService.checkIdleUsers();
    
    // Broadcast updated presence for all active documents
    const activeDocuments = this.presenceService.getActiveDocuments();
    for (const documentId of activeDocuments) {
      const users = this.presenceService.getUsersInDocument(documentId);
      const idleUsers = users.filter(u => u.status === UserStatus.IDLE);
      
      if (idleUsers.length > 0) {
        this.server.to(documentId).emit('presence-update', {
          users,
          typingUsers: this.presenceService.getTypingUsers(documentId),
        });
      }
    }
  }

  /**
   * Generate consistent color for user
   */
  private generateUserColor(userId: string): string {
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
    
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    this.presenceService.cleanup();
  }
}
