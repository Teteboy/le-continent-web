import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dltkfjkodqpzmpuctnju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

/**
 * Serial-queue lock to replace Supabase's default Web Locks-based locking.
 *
 * Supabase uses navigator.locks with `steal: true` which throws
 * "Lock broken by another request with the 'steal' option." when multiple
 * concurrent auth operations compete (e.g. React StrictMode double-invoke,
 * or getSession() + onAuthStateChange firing simultaneously).
 *
 * This serial queue ensures auth operations run one after another
 * without the native Web Lock, preventing the error while staying safe.
 */
const queues = new Map<string, Promise<unknown>>();

function serialLock<T>(name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> {
  // Get previous queue or create new one
  const prev = queues.get(name) ?? Promise.resolve();
  
  // Create new promise that runs after previous completes
  // Don't use timeout - let it wait indefinitely to avoid breaking operations
  const next = prev
    .then(() => fn())
    .catch(err => {
      console.warn('Serial lock error:', err.message);
      // Return null instead of throwing to prevent chain breakage
      return null as unknown as T;
    });
  
  // Update queue - track completion (use 'queues', not 'queries')
  queues.set(name, next.then(() => {}, () => {}));
  
  return next;
}

// In-memory cache for data queries to prevent hanging
const dataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Cached query helper - simplified version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cachedQuery(table: string, query: any) {
  // Use table name as base cache key (remove village id part if present)
  const cacheKey = table.split(':')[0];
  
  // Check cache first for instant load
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data, error: null, fromCache: true };
  }

  try {
    const result = await query;
    
    if (!result.error && result.data) {
      dataCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
    }
    return { ...result, fromCache: false };
  } catch {
    if (cached) {
      return { data: cached.data, error: null, fromCache: true };
    }
    console.warn('Query failed, returning empty data:', table);
    return { data: [], error: null, fromCache: false };
  }
}

// Export cache functions
export function clearCache() {
  dataCache.clear();
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: serialLock,
  },
  global: {
    fetch: (url, options) => {
      // Add timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeout);
      });
    },
  },
});
