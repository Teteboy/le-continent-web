/**
 * React Query Configuration
 * Optimized settings for data fetching and caching
 */

import type { DefaultOptions } from '@tanstack/react-query';

export const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Garbage collection: how long unused data is kept in cache
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)

    // Refetch behavior — critical for keeping content alive:
    refetchOnWindowFocus: true, // Refetch stale data when user returns to tab/app
    refetchOnReconnect: true, // Refetch on reconnect to avoid stale data
    refetchOnMount: true, // Always refetch stale data when component mounts (navigation)

    // Retry strategy — 2 retries for unreliable mobile networks
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

    // Network timeout for queries (30 seconds)
    // NOTE: Do NOT set placeholderData globally — it hides loading states
    // for new queries where previousData is undefined, causing blank pages.
  },

  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,
  },
};

// Specific config for different query types
export const specificConfigs = {
  // Fast-changing data (referrals, profiles)
  realtime: {
    staleTime: 0, // Always fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  },

  // Static data (villages, categories)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  },

  // Semi-dynamic data (content)
  content: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },

  // User profile
  profile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // Villages - long caching since they rarely change
  villages: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};
