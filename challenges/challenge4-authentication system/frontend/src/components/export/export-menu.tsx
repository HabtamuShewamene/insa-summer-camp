'use client';

import { useState } from 'react';
import { Download, FileText, FileCode, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';

interface ExportMenuProps {
  documentId: string;
  documentTitle: string;
}

export function ExportMenu({ documentId, documentTitle }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'markdown' | 'text' | 'html' | 'pdf') => {
    setIsExporting(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${API_URL}/documents/${documentId}/export/${format}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Determine file extension
      const extensions: Record<string, string> = {
        markdown: 'md',
        text: 'txt',
        html: 'html',
        pdf: 'html', // PDF export returns HTML for print
      };
      
      const extension = extensions[format];
      const filename = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <FileCode className="h-4 w-4 mr-2" />
          Markdown (.md)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('text')}>
          <FileText className="h-4 w-4 mr-2" />
          Plain Text (.txt)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('html')}>
          <File className="h-4 w-4 mr-2" />
          HTML (.html)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <Download className="h-4 w-4 mr-2" />
          PDF (Print)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
