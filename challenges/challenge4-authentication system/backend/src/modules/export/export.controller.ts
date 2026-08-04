import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('documents/:id/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('markdown')
  async exportMarkdown(
    @Param('id') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const markdown = await this.exportService.exportToMarkdown(documentId, userId);
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="document.md"`);
    res.send(markdown);
  }

  @Get('text')
  async exportText(
    @Param('id') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const text = await this.exportService.exportToPlainText(documentId, userId);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="document.txt"`);
    res.send(text);
  }

  @Get('html')
  async exportHTML(
    @Param('id') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const html = await this.exportService.exportToHTML(documentId, userId);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="document.html"`);
    res.send(html);
  }

  @Get('pdf')
  async exportPDF(
    @Param('id') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    
    // Get HTML first
    const html = await this.exportService.exportToHTML(documentId, userId);
    
    // For PDF generation, we'll return HTML with print styles
    // In production, you could use puppeteer or a PDF service
    const printHTML = html.replace(
      '</style>',
      `
      @media print {
        body { margin: 0; padding: 20px; }
        .footer { page-break-before: always; }
      }
      @page { margin: 2cm; }
      </style>`
    );
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(printHTML + '<script>window.print();</script>');
  }
}