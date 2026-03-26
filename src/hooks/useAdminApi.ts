import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Admin hooks that use Supabase directly (no API calls to avoid CORS issues)

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalReferrals: number;
  activePromoCodes: number;
  totalVillages: number;
  estimatedRevenue: number;
  updatedAt: string;
}

/**
 * Fetch admin stats directly from Supabase
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const [
    usersRes,
    premiumRes,
    referralsRes,
    promoRes,
    villagesRes
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('referrals').select('id', { count: 'exact', head: true }),
    supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('villages').select('id', { count: 'exact', head: true })
  ]);

  const totalUsers = usersRes.count ?? 0;
  const premiumUsers = premiumRes.count ?? 0;

  return {
    totalUsers,
    premiumUsers,
    freeUsers: totalUsers - premiumUsers,
    totalReferrals: referralsRes.count ?? 0,
    activePromoCodes: promoRes.count ?? 0,
    totalVillages: villagesRes.count ?? 0,
    estimatedRevenue: premiumUsers * 1000,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fetch paginated users from Supabase
 */
export async function fetchAdminUsers(page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    users: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit)
  };
}

/**
 * Hook for admin stats - uses Supabase directly
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: false,
  });
}

/**
 * Hook for admin users - uses Supabase directly
 */
export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin-users', page, limit],
    queryFn: () => fetchAdminUsers(page, limit),
    staleTime: 30 * 1000,
    refetchInterval: false,
  });
}
