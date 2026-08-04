import { Module } from '@nestjs/common';
import { SocketServer } from './socket.server';
import { SyncService } from './sync.service';
import { DocumentRoomService } from './document.room';
import { PresenceService } from './presence.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [SocketServer, SyncService, DocumentRoomService, PresenceService],
  exports: [SocketServer, SyncService, PresenceService],
})
export class SocketModule {}
