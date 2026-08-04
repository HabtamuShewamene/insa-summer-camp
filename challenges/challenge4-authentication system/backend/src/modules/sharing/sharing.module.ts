import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { SharingController } from './controllers/sharing.controller';
import { SharingRepository } from './repositories/sharing.repository';
import { SharingService } from './services/sharing.service';
import { DocumentPermissionMiddleware } from './validators/document-permission.middleware';

@Module({
  imports: [PrismaModule, SocketModule],
  controllers: [SharingController],
  providers: [SharingService, SharingRepository, DocumentPermissionMiddleware],
  exports: [SharingService, DocumentPermissionMiddleware],
})
export class SharingModule {}