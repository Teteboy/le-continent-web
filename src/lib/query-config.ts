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
    
    // Refetch behavior - disabled for better UX
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent loading spinners
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: false, // Don't refetch if data is still fresh
    
    // Retry strategy
    retry: 1, // Only retry once
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Keep previous data while refetching
    placeholderData: (previousData: unknown) => previousData,
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

  // User profile - more aggressive caching
  profile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  // Villages - very long caching since they rarely change
  villages: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
};
