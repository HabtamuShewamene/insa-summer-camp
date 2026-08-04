import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  matchType: 'title' | 'content' | 'comment';
  highlights?: string[];
  commentCount?: number;
  isShared?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took: number;
}

export const searchService = {
  async search(query: string, limit = 20, offset = 0): Promise<SearchResponse> {
    const response = await axios.get(`${API_URL}/search`, {
      params: { q: query, limit, offset },
      withCredentials: true,
    });
    return response.data.data;
  },

  async getRecentSearches(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/search/recent`, {
      withCredentials: true,
    });
    return response.data.data;
  },
};