import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RenameDocumentDto } from './dto/rename-document.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  create(@Req() req: any, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(req.user.id, createDocumentDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.documentService.findAll(req.user.id);
  }

  @Get('recent')
  findRecent(@Req() req: any) {
    return this.documentService.findRecent(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.documentService.findOne(req.user.id, id);
  }

  @Patch(':id')
  rename(@Req() req: any, @Param('id') id: string, @Body() renameDocumentDto: RenameDocumentDto) {
    return this.documentService.rename(req.user.id, id, renameDocumentDto);
  }

  @Patch(':id/open')
  open(@Req() req: any, @Param('id') id: string) {
    return this.documentService.open(req.user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(@Req() req: any, @Param('id') id: string) {
    return this.documentService.duplicate(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.documentService.remove(req.user.id, id);
  }
}
