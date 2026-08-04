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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import { DocumentRoomService, RoomUser } from './document.room';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketServer implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketServer.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly syncService: SyncService,
    private readonly roomService: DocumentRoomService,
    private readonly prisma: PrismaService,
  ) {}

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
      if (user) {
        client.to(documentId).emit('user-left', { userId: user.id, socketId: client.id });
        const users = this.roomService.getUsersInRoom(documentId);
        this.server.to(documentId).emit('room-users', users);
        
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

    // Verify document exists and user has access (for now we assume if it exists and isn't deleted)
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.isDeleted) {
      client.emit('error', { message: 'Document not found or inaccessible' });
      return;
    }

    client.join(documentId);
    
    const roomUser: RoomUser = {
      id: user.id,
      name: user.name,
      socketId: client.id,
      color: color || '#000000',
    };
    this.roomService.addUser(documentId, roomUser);

    // Notify others in room
    client.to(documentId).emit('user-joined', roomUser);
    
    // Send current active users
    const users = this.roomService.getUsersInRoom(documentId);
    this.server.to(documentId).emit('room-users', users);

    // Synchronize Yjs state
    // Send the current server Yjs state vector to the client so it can send missing updates
    const stateVector = this.syncService.getStateVector(documentId);
    client.emit('sync-step-1', stateVector);
    
    // Also send full update to client to ensure they have the latest
    const update = this.syncService.getUpdate(documentId);
    client.emit('document-update', update);

    this.logger.log(`User ${user.name} joined document ${documentId}`);
  }

  @SubscribeMessage('leave-document')
  handleLeaveDocument(@ConnectedSocket() client: Socket, @MessageBody() data: { documentId: string }) {
    const { documentId } = data;
    client.leave(documentId);
    const user = this.roomService.removeUser(documentId, client.id);
    if (user) {
      client.to(documentId).emit('user-left', { userId: user.id, socketId: client.id });
      const users = this.roomService.getUsersInRoom(documentId);
      this.server.to(documentId).emit('room-users', users);
      this.syncService.removeDocIfEmpty(documentId, users.length);
    }
  }

  @SubscribeMessage('document-update')
  handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string, update: Uint8Array }
  ) {
    const { documentId, update } = data;
    
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
    client.to(data.documentId).emit('awareness-update', new Uint8Array(data.update));
  }
}
