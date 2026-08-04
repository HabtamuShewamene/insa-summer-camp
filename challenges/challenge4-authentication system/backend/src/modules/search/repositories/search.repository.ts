import { PrismaClient } from '@prisma/client';
import { SearchQuery, SearchResult } from '../types/search.types';

export class SearchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchDocuments(userId: string, query: SearchQuery): Promise<SearchResult[]> {
    const { query: searchTerm, filters, limit = 20, offset = 0 } = query;
    
    // Build where clause for accessible documents
    const accessibleDocuments = {
      OR: [
        { ownerId: userId },
        {
          permissions: {
            some: {
              userId: userId,
            },
          },
        },
      ],
      isDeleted: false,
      isArchived: false,
    };

    // Search in document titles and content
    const documents = await this.prisma.document.findMany({
      where: {
        AND: [
          accessibleDocuments,
          {
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        content: {
          select: {
            content: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        permissions: {
          select: {
            id: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Search in comments
    const commentsResults = await this.prisma.comment.findMany({
      where: {
        content: {
          contains: searchTerm,
          mode: 'insensitive',
        },
        document: accessibleDocuments,
      },
      include: {
        document: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            comments: {
              select: {
                id: true,
              },
            },
            permissions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
    });

    // Transform documents to search results
    const documentResults: SearchResult[] = documents.map((doc) => {
      const contentText = this.extractTextFromContent(doc.content?.content);
      const excerpt = this.createExcerpt(contentText, searchTerm);

      return {
        id: doc.id,
        title: doc.title,
        content: contentText,
        excerpt,
        owner: doc.owner,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        matchType: doc.title.toLowerCase().includes(searchTerm.toLowerCase())
          ? 'title'
          : 'content',
        highlights: this.findHighlights(doc.title + ' ' + contentText, searchTerm),
        commentCount: doc.comments.length,
        isShared: doc.permissions.length > 0,
      };
    });

    // Transform comment results
    const commentDocumentResults: SearchResult[] = commentsResults.map((comment) => {
      const doc = comment.document;
      
      return {
        id: doc.id,
        title: doc.title,
        excerpt: this.createExcerpt(comment.content, searchTerm),
        owner: doc.owner,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        matchType: 'comment',
        highlights: [comment.content],
        commentCount: doc.comments.length,
        isShared: doc.permissions.length > 0,
      };
    });

    // Combine and deduplicate results
    const combinedResults = [...documentResults, ...commentDocumentResults];
    const uniqueResults = this.deduplicateResults(combinedResults);

    return uniqueResults.slice(0, limit);
  }

  private extractTextFromContent(content: any): string {
    if (!content) return '';
    
    try {
      if (typeof content === 'string') {
        return content;
      }
      
      if (content.content && Array.isArray(content.content)) {
        return this.extractTextFromNodes(content.content);
      }
      
      return JSON.stringify(content);
    } catch (error) {
      return '';
    }
  }

  private extractTextFromNodes(nodes: any[]): string {
    let text = '';
    
    for (const node of nodes) {
      if (node.text) {
        text += node.text + ' ';
      }
      
      if (node.content && Array.isArray(node.content)) {
        text += this.extractTextFromNodes(node.content);
      }
    }
    
    return text.trim();
  }

  private createExcerpt(text: string, searchTerm: string, maxLength: number = 200): string {
    if (!text) return '';
    
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 150);
    
    let excerpt = text.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  private findHighlights(text: string, searchTerm: string, maxHighlights: number = 3): string[] {
    const highlights: string[] = [];
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    
    let index = lowerText.indexOf(lowerTerm);
    
    while (index !== -1 && highlights.length < maxHighlights) {
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + searchTerm.length + 30);
      
      let highlight = text.substring(start, end);
      if (start > 0) highlight = '...' + highlight;
      if (end < text.length) highlight = highlight + '...';
      
      highlights.push(highlight);
      
      index = lowerText.indexOf(lowerTerm, index + 1);
    }
    
    return highlights;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];
    
    for (const result of results) {
      if (!seen.has(result.id)) {
        seen.add(result.id);
        unique.push(result);
      }
    }
    
    return unique;
  }

  async getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
    // This would require a search_history table
    // For now, return empty array
    return [];
  }

  async saveSearch(userId: string, query: string): Promise<void> {
    // This would save to search_history table
    // For now, no-op
  }
}