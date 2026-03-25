import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Get API URL - use localhost in development, production API in production
// Can override with VITE_API_URL environment variable
const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL
  : (isDev ? 'http://localhost:3000' : 'https://api.lecontinent.cm');

export const FREE_LIMIT = 3;
export const ITEMS_PER_PAGE = 10;

// Helper to generate fake locked counts for free users
// Different ranges for different content types to make it look realistic
function generateFakeLockedCount(tableName: string): number {
  // Different fake counts based on content type
  const ranges: Record<string, number[]> = {
    mets: [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000],
    proverbes: [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500],
    phrases: [600, 800, 1000, 1200, 1500, 1800, 2000, 2200],
    lexique: [1500, 1800, 2000, 2200, 2500, 2800, 3000, 3500],
    histoire: [300, 400, 500, 600, 700, 800, 900, 1000],
    alphabet: [200, 300, 400, 500, 600, 700, 800, 900],
    cultures_books: [100, 150, 200, 250, 300, 350, 400, 450],
  };
  
  const options = ranges[tableName] || [500, 700, 1000, 1500, 2000, 2500, 3000, 3500];
  return options[Math.floor(Math.random() * options.length)];
}

interface UseVillageContentOptions {
  table: string;
  villageId: string | undefined;
  isPremium: boolean;
  currentPage: number;
  search?: string;
  searchColumns?: string[];
  orderBy?: string;
  orderAscending?: boolean;
  /** Pass `true` while auth is still loading to prevent premature fetches */
  authLoading?: boolean;
}

interface VillageContentResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  lockedCount: number;
  fakeLockedCount?: number; // For free users - randomized display count
}

export function useVillageContent<T = Record<string, unknown>>({
  table,
  villageId,
  isPremium,
  currentPage,
  search = '',
  searchColumns = [],
  orderBy = 'created_at',
  orderAscending = true,
  authLoading = false,
}: UseVillageContentOptions) {
  // Don't start fetching until we know the user's premium status
  // to avoid creating a query with isPremium=false then immediately
  // invalidating it when auth resolves to isPremium=true (blank flash)
  const enabled = !!villageId && !authLoading;
  
  const query = useQuery<VillageContentResult<T>>({
    queryKey: ['village', table, villageId, isPremium ? 'premium' : 'free', currentPage, search.trim()],
    queryFn: async (): Promise<VillageContentResult<T>> => {
      if (!villageId) return { items: [], total: 0, totalPages: 0, lockedCount: 0 };

      // Try backend API first
      try {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString(),
            isPremium: isPremium ? 'true' : 'false',
            orderBy: orderBy,
            orderAsc: orderAscending.toString(),
          });
          
          if (villageId) params.append('villageId', villageId);
          if (search.trim()) params.append('search', search.trim());

          const apiUrl = `${API_BASE}/api/content/${table}?${params.toString()}`;
          console.log('[useVillageContent] Fetching from API:', apiUrl);
          
          // Abort if API takes too long (5s) — fall back to Supabase
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            const cacheStatus = response.headers.get('X-Cache');
            console.log('[useVillageContent] API response:', cacheStatus || 'MISS', '- items:', data.items?.length || 0);
            
            // Transform API response to match expected format
            return {
              items: data.items || [],
              total: data.total || 0,
              totalPages: data.totalPages || 0,
              // For non-premium, use fake locked count to encourage upgrade
              lockedCount: isPremium ? 0 : Math.max(0, (data.total || 0) - FREE_LIMIT),
              fakeLockedCount: !isPremium ? generateFakeLockedCount(table) : undefined,
            };
          }
          
          console.log('[useVillageContent] API failed, falling back to Supabase');
        } catch (apiErr) {
          console.log('[useVillageContent] API error, falling back to Supabase:', apiErr);
        }

      // For free users: fetch count only (not all items) to show locked content prompt
// Don't use paginated API for free users - they only see 3 free items anyway
if (!isPremium) {
  // Get total count for fake locked display
  const { count: totalCount } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('village_id', villageId);

  // Return only free items (first 3) + fake locked count
  const realTotal = totalCount ?? FREE_LIMIT;
  const lockedCount = Math.max(0, realTotal - FREE_LIMIT);
  const fakeLockedCount = generateFakeLockedCount(table);
  
  // Fetch just 3 free items for display
  const { data: freeItems } = await supabase
    .from(table)
    .select('*')
    .eq('village_id', villageId)
    .order(orderBy, { ascending: orderAscending })
    .limit(FREE_LIMIT);

  return {
    items: (freeItems ?? []) as T[],
    total: realTotal,
    totalPages: 0,
    lockedCount,
    fakeLockedCount,
  };
}

      // Premium: full pagination with optional server-side search
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const searchFilter =
        search.trim() && searchColumns.length > 0
          ? searchColumns.map((c) => `${c}.ilike.%${search.trim()}%`).join(',')
          : null;

      let countQ = supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('village_id', villageId);
      let dataQ = supabase.from(table).select('*').eq('village_id', villageId);

      if (searchFilter) {
        countQ = countQ.or(searchFilter);
        dataQ = dataQ.or(searchFilter);
      }

      const [countRes, dataRes] = await Promise.all([
        countQ,
        dataQ.order(orderBy, { ascending: orderAscending }).range(from, to),
      ]);

      if (countRes.error) throw countRes.error;
      if (dataRes.error) throw dataRes.error;

      const total = countRes.count ?? 0;
      return {
        items: (dataRes.data ?? []) as T[],
        total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        lockedCount: 0,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache for back-navigation
    refetchOnWindowFocus: true, // Refetch stale data when user returns to tab
    refetchOnMount: true, // Always refetch stale data on navigation
    // Use keepPreviousData so page transitions show old data while refetching
    // (only works when there IS previous data; new queries still show loading)
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
  });

  // Expose a combined isLoading that includes authLoading,
  // so consumers don't need to check both independently
  return {
    ...query,
    isLoading: query.isLoading || authLoading,
  };
}
