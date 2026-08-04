import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { SearchQuery } from '../types/search.types';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { q, limit, offset } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const searchQuery: SearchQuery = {
        query: q,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      };

      const results = await this.searchService.search(userId, searchQuery);

      // Save search to history
      await this.searchService.saveSearch(userId, q);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };

  getRecentSearches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const recent = await this.searchService.getRecentSearches(userId);

      res.json({
        success: true,
        data: recent,
      });
    } catch (error) {
      next(error);
    }
  };
}