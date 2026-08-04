import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentPermissionLevel } from '@prisma/client';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToMarkdown(documentId: string, userId: string): Promise<string> {
    const document = await this.getDocumentWithPermissionCheck(documentId, userId);
    
    let markdown = `# ${document.title}\n\n`;
    
    if (document.content?.content) {
      markdown += this.convertContentToMarkdown(document.content.content);
    }
    
    markdown += `\n\n---\n\n`;
    markdown += `*Created by: ${document.owner.name}*\n`;
    markdown += `*Last updated: ${document.updatedAt.toLocaleDateString()}*\n`;
    
    return markdown;
  }

  async exportToPlainText(documentId: string, userId: string): Promise<string> {
    const document = await this.getDocumentWithPermissionCheck(documentId, userId);
    
    let text = `${document.title}\n`;
    text += '='.repeat(document.title.length) + '\n\n';
    
    if (document.content?.content) {
      text += this.convertContentToPlainText(document.content.content);
    }
    
    text += `\n\n---\n\n`;
    text += `Created by: ${document.owner.name}\n`;
    text += `Last updated: ${document.updatedAt.toLocaleDateString()}\n`;
    
    return text;
  }

  async exportToHTML(documentId: string, userId: string): Promise<string> {
    const document = await this.getDocumentWithPermissionCheck(documentId, userId);
    
    let html = `<!DOCTYPE html>\n<html>\n<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <title>${this.escapeHtml(document.title)}</title>\n`;
    html += `  <style>\n`;
    html += `    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }\n`;
    html += `    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }\n`;
    html += `    h2, h3 { margin-top: 24px; }\n`;
    html += `    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }\n`;
    html += `    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }\n`;
    html += `    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }\n`;
    html += `    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }\n`;
    html += `  </style>\n</head>\n<body>\n`;
    
    html += `  <h1>${this.escapeHtml(document.title)}</h1>\n`;
    
    if (document.content?.content) {
      html += this.convertContentToHTML(document.content.content);
    }
    
    html += `  <div class="footer">\n`;
    html += `    <p><em>Created by: ${this.escapeHtml(document.owner.name)}</em></p>\n`;
    html += `    <p><em>Last updated: ${document.updatedAt.toLocaleDateString()}</em></p>\n`;
    html += `  </div>\n`;
    html += `</body>\n</html>`;
    
    return html;
  }

  private async getDocumentWithPermissionCheck(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        content: true,
        permissions: {
          where: { userId },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access
    const isOwner = document.ownerId === userId;
    const hasPermission = document.permissions.length > 0;

    if (!isOwner && !hasPermission) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  private convertContentToMarkdown(content: any): string {
    if (!content || !content.content) return '';
    
    return this.processNodesForMarkdown(content.content);
  }

  private processNodesForMarkdown(nodes: any[]): string {
    let markdown = '';
    
    for (const node of nodes) {
      if (node.type === 'paragraph') {
        markdown += this.processInlineContent(node.content || []) + '\n\n';
      } else if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        const headingPrefix = '#'.repeat(level);
        markdown += `${headingPrefix} ${this.processInlineContent(node.content || [])}\n\n`;
      } else if (node.type === 'bulletList') {
        markdown += this.processList(node.content || [], false) + '\n';
      } else if (node.type === 'orderedList') {
        markdown += this.processList(node.content || [], true) + '\n';
      } else if (node.type === 'blockquote') {
        const content = this.processNodesForMarkdown(node.content || []);
        markdown += content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
      } else if (node.type === 'codeBlock') {
        const code = this.extractText(node.content || []);
        const language = node.attrs?.language || '';
        markdown += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      } else if (node.type === 'horizontalRule') {
        markdown += '---\n\n';
      }
    }
    
    return markdown;
  }

  private processList(items: any[], ordered: boolean): string {
    let result = '';
    
    items.forEach((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- ';
      const content = this.processNodesForMarkdown(item.content || []).trim();
      result += `${prefix}${content}\n`;
    });
    
    return result;
  }

  private processInlineContent(content: any[]): string {
    let text = '';
    
    for (const node of content) {
      if (node.type === 'text') {
        let nodeText = node.text || '';
        
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') {
              nodeText = `**${nodeText}**`;
            } else if (mark.type === 'italic') {
              nodeText = `*${nodeText}*`;
            } else if (mark.type === 'code') {
              nodeText = `\`${nodeText}\``;
            } else if (mark.type === 'link') {
              const href = mark.attrs?.href || '';
              nodeText = `[${nodeText}](${href})`;
            } else if (mark.type === 'underline') {
              nodeText = `<u>${nodeText}</u>`;
            }
          }
        }
        
        text += nodeText;
      }
    }
    
    return text;
  }

  private convertContentToPlainText(content: any): string {
    if (!content || !content.content) return '';
    
    return this.extractText(content.content);
  }

  private extractText(nodes: any[]): string {
    let text = '';
    
    for (const node of nodes) {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content) {
        text += this.extractText(node.content);
      }
      
      // Add appropriate spacing
      if (node.type === 'paragraph' || node.type === 'heading') {
        text += '\n\n';
      } else if (node.type === 'hardBreak') {
        text += '\n';
      }
    }
    
    return text;
  }

  private convertContentToHTML(content: any): string {
    if (!content || !content.content) return '';
    
    return this.processNodesForHTML(content.content);
  }

  private processNodesForHTML(nodes: any[]): string {
    let html = '';
    
    for (const node of nodes) {
      if (node.type === 'paragraph') {
        html += `  <p>${this.processInlineContentForHTML(node.content || [])}</p>\n`;
      } else if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        html += `  <h${level}>${this.processInlineContentForHTML(node.content || [])}</h${level}>\n`;
      } else if (node.type === 'bulletList') {
        html += `  <ul>\n${this.processListForHTML(node.content || [])}  </ul>\n`;
      } else if (node.type === 'orderedList') {
        html += `  <ol>\n${this.processListForHTML(node.content || [])}  </ol>\n`;
      } else if (node.type === 'blockquote') {
        html += `  <blockquote>\n${this.processNodesForHTML(node.content || [])}  </blockquote>\n`;
      } else if (node.type === 'codeBlock') {
        const code = this.escapeHtml(this.extractText(node.content || []));
        html += `  <pre><code>${code}</code></pre>\n`;
      } else if (node.type === 'horizontalRule') {
        html += `  <hr>\n`;
      }
    }
    
    return html;
  }

  private processListForHTML(items: any[]): string {
    let html = '';
    
    for (const item of items) {
      html += `    <li>${this.processInlineContentForHTML(item.content?.[0]?.content || [])}</li>\n`;
    }
    
    return html;
  }

  private processInlineContentForHTML(content: any[]): string {
    let html = '';
    
    for (const node of content) {
      if (node.type === 'text') {
        let nodeText = this.escapeHtml(node.text || '');
        
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') {
              nodeText = `<strong>${nodeText}</strong>`;
            } else if (mark.type === 'italic') {
              nodeText = `<em>${nodeText}</em>`;
            } else if (mark.type === 'code') {
              nodeText = `<code>${nodeText}</code>`;
            } else if (mark.type === 'link') {
              const href = this.escapeHtml(mark.attrs?.href || '');
              nodeText = `<a href="${href}">${nodeText}</a>`;
            } else if (mark.type === 'underline') {
              nodeText = `<u>${nodeText}</u>`;
            }
          }
        }
        
        html += nodeText;
      } else if (node.type === 'hardBreak') {
        html += '<br>';
      }
    }
    
    return html;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}