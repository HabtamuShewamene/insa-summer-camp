import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VersionHistoryService } from './version-history.service';
import { CreateVersionDto } from './dto/create-version.dto';

@UseGuards(JwtAuthGuard)
@Controller('documents/:documentId/versions')
export class VersionHistoryController {
  constructor(private readonly versionHistoryService: VersionHistoryService) {}

  @Get()
  getVersions(@Param('documentId') documentId: string, @Request() req: any) {
    return this.versionHistoryService.getVersions(documentId, req.user.id);
  }

  @Get(':versionId')
  getVersion(
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @Request() req: any,
  ) {
    return this.versionHistoryService.getVersion(documentId, versionId, req.user.id);
  }

  @Post()
  createVersion(
    @Param('documentId') documentId: string,
    @Body() dto: CreateVersionDto,
    @Request() req: any,
  ) {
    return this.versionHistoryService.createManualVersion(documentId, req.user.id, dto);
  }

  @Post(':versionId/restore')
  restoreVersion(
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @Request() req: any,
  ) {
    return this.versionHistoryService.restoreVersion(documentId, versionId, req.user.id);
  }
}