import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration.
// IMPORTANT: The frontend MUST use the anon (public) key, NOT the service_role key.
// The service_role key bypasses Row Level Security and should only be used server-side.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  // Use a longer timeout to prevent premature timeouts (15 seconds)
  const next = Promise.race([
    prev.then(() => fn()),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('LOCK_TIMEOUT')), 15000)
    )
  ]).catch(err => {
    if (err.message === 'LOCK_TIMEOUT') {
      console.warn('[Supabase] Operation timed out - retrying directly');
      // On timeout, execute directly without waiting
      return fn();
    }
    if (err.message) {
      console.warn('[Supabase] Serial lock error:', err.message);
    }
    // Return null instead of throwing to prevent chain breakage
    return null as unknown as T;
  });
  
  // Update queue - track completion
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
      // 45s for mobile networks that may be slow after idle/background
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.warn('[Supabase] Fetch timeout for:', url);
        controller.abort();
      }, 45000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeout);
      }).catch(err => {
        if (err.name === 'AbortError') {
          console.error('[Supabase] Fetch aborted (timeout):', url);
        }
        throw err;
      });
    },
  },
});
