import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SharingService } from '../services/sharing.service';
import { ShareDocumentDto } from '../dto/share-document.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@UseGuards(JwtAuthGuard)
@Controller('documents/:documentId')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('share')
  shareDocument(
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Body() dto: ShareDocumentDto,
  ) {
    return this.sharingService.shareDocument(documentId, req.user.id, dto);
  }

  @Get('permissions')
  getSharedUsers(@Param('documentId') documentId: string, @Req() req: any) {
    return this.sharingService.getDocumentPermissions(documentId, req.user.id);
  }

  @Patch('permissions/:permissionId')
  updatePermission(
    @Param('documentId') documentId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: any,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.sharingService.updatePermission(documentId, permissionId, req.user.id, dto);
  }

  @Delete('permissions/:permissionId')
  removePermission(
    @Param('documentId') documentId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: any,
  ) {
    return this.sharingService.removePermission(documentId, permissionId, req.user.id);
  }
}