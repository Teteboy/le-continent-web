import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReferralRecord } from '@/types';

export function useReferrals(userId: string | undefined) {
  return useQuery<ReferralRecord[]>({
    queryKey: ['referrals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        console.log('[useReferrals] Fetching referrals for user:', userId);
        const { data, error } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useReferrals] Supabase error:', error.message);
          return [];
        }
        
        console.log('[useReferrals] Found referrals:', data?.length ?? 0);
        return (data ?? []) as ReferralRecord[];
      } catch (err) {
        console.error('[useReferrals] Exception:', err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent constant refetching
    refetchInterval: false, // Disable auto-refresh
    refetchOnWindowFocus: false, // Disable refetch on window focus
    retry: 1, // Only retry once
    retryDelay: 500,
  });
}

