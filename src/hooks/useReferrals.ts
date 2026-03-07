import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReferralRecord } from '@/types';

export function useReferrals(userId: string | undefined) {
  return useQuery<ReferralRecord[]>({
    queryKey: ['referrals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          // Table might not exist - return empty array gracefully
          console.warn('Referrals table not available:', error.message);
          return [];
        }
        return (data ?? []) as ReferralRecord[];
      } catch (err) {
        console.warn('Error fetching referrals:', err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 30_000,
    retry: false, // Don't retry on error since table might not exist
  });
}
