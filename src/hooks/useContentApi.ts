/**
 * Custom hook for managing content with API integration
 * Replaces direct Supabase calls with API layer
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api-client';
import { useContentStore, type ContentItem } from '@/store/contentStore';
import { specificConfigs } from '@/lib/query-config';

interface UseContentOptions {
  villageId?: string;
  isPremium?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useContent(
  table: string,
  options: UseContentOptions = {}
) {
  const {
    villageId,
    isPremium = false,
    limit = 100,
    offset = 0,
    enabled = true,
  } = options;

  const setContent = useContentStore((state) => state.setContent);
  const setLoading = useContentStore((state) => state.setLoading);
  const setError = useContentStore((state) => state.setError);

  return useQuery({
    queryKey: ['content', table, villageId, isPremium],
    queryFn: async () => {
      try {
        setLoading(table, true);
        setError(table, null);

        const response = await contentApi.get(table, {
          villageId,
          isPremium: isPremium ? 'true' : 'false',
          limit,
          offset,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const items = (response.items as ContentItem[]) || [];
        setContent(table, items);

        return {
          items,
          count: response.count || 0,
          total: response.total || 0,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load content';
        setError(table, errorMsg);
        throw error;
      } finally {
        setLoading(table, false);
      }
    },
    enabled: enabled && !!villageId,
    ...specificConfigs.content,
  });
}

export function useContentSearch(
  tables: string[],
  query: string,
  villageId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['content', 'search', query, tables, villageId],
    queryFn: async () => {
      const response = await contentApi.search({
        tables,
        query,
        villageId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.results;
    },
    enabled: enabled && !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetch content for a table (loads data in background)
 */
export function usePrefetchContent(table: string, villageId?: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: ['content', table, villageId],
      queryFn: async () => {
        const response = await contentApi.get(table, { villageId });
        return response.items || [];
      },
      ...specificConfigs.content,
    });
  };
}
