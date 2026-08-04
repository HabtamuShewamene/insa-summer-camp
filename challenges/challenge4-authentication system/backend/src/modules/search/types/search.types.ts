export interface SearchQuery {
  query: string;
  filters?: {
    owner?: string;
    shared?: boolean;
    hasComments?: boolean;
  };
  limit?: number;
  offset?: number;
}

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
  createdAt: Date;
  updatedAt: Date;
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