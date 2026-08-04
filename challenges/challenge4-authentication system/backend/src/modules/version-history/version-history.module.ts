import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { SharingModule } from '../sharing/sharing.module';
import { VersionHistoryController } from './version-history.controller';
import { VersionHistoryRepository } from './repositories/version-history.repository';
import { VersionHistoryService } from './version-history.service';
import { VersionHistoryValidator } from './validators/version-history.validator';

@Module({
  imports: [PrismaModule, SocketModule, SharingModule],
  controllers: [VersionHistoryController],
  providers: [VersionHistoryService, VersionHistoryRepository, VersionHistoryValidator],
  exports: [VersionHistoryService],
})
export class VersionHistoryModule {}