import { QueryClient } from '@tanstack/react-query';

/**
 * Query invalidation helpers for common data refresh scenarios
 */

export const queryInvalidation = {
  // Invalidate all user-related queries
  invalidateUserData: (queryClient: QueryClient, userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['referrals', userId] });
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['referrals'] });
  },

  // Invalidate village content
  invalidateVillageContent: (queryClient: QueryClient, villageId?: string) => {
    if (villageId) {
      queryClient.invalidateQueries({ queryKey: ['village'] });
    }
  },

  // Invalidate after payment
  invalidateAfterPayment: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    queryClient.invalidateQueries({ queryKey: ['payment'] });
  },

  // Clear all caches (nuclear option)
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};
