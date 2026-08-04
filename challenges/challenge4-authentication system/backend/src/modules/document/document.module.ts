import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { VersionHistoryModule } from '../version-history/version-history.module';
import { SharingModule } from '../sharing/sharing.module';

@Module({
  imports: [VersionHistoryModule, SharingModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
