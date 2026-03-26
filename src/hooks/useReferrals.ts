import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/lib/api-client';
import type { ReferralRecord } from '@/types';

export function useReferrals(userId: string | undefined) {
  return useQuery<ReferralRecord[]>({
    queryKey: ['referrals', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        console.log('[useReferrals] Fetching referrals for user:', userId);
        const response = await referralApi.list(userId);

        if (response.error) {
          console.error('[useReferrals] API error:', response.error);
          return [];
        }

        const referrals = (response as { referrals?: ReferralRecord[] }).referrals ?? [];
        console.log('[useReferrals] Found referrals:', referrals.length);
        return referrals as ReferralRecord[];
      } catch (err) {
        console.error('[useReferrals] Exception:', err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000),
  });
}
