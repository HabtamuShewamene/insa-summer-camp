import { Module } from '@nestjs/common';
import { SocketServer } from './socket.server';
import { SyncService } from './sync.service';
import { DocumentRoomService } from './document.room';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [SocketServer, SyncService, DocumentRoomService],
  exports: [SocketServer, SyncService],
})
export class SocketModule {}
