import { SearchRepository } from '../repositories/search.repository';
import { SearchQuery, SearchResponse } from '../types/search.types';

export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async search(userId: string, query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();

    const results = await this.searchRepository.searchDocuments(userId, query);
    
    const took = Date.now() - startTime;

    return {
      results,
      total: results.length,
      query: query.query,
      took,
    };
  }

  async getRecentSearches(userId: string): Promise<string[]> {
    return this.searchRepository.getRecentSearches(userId);
  }

  async saveSearch(userId: string, query: string): Promise<void> {
    if (query.trim().length > 0) {
      await this.searchRepository.saveSearch(userId, query);
    }
  }
}