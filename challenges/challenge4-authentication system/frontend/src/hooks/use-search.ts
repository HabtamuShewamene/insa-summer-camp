'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService, SearchResponse } from '@/lib/search.service';
import { useDebounce } from './use-debounce';

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    search,
    clearSearch,
    results: data?.results || [],
    total: data?.total || 0,
    took: data?.took || 0,
    isLoading,
    error,
    hasQuery: debouncedQuery.length > 0,
    refetch,
  };
}

export function useRecentSearches() {
  return useQuery<string[]>({
    queryKey: ['search', 'recent'],
    queryFn: searchService.getRecentSearches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}