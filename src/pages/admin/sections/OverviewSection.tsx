import { useQuery } from '@tanstack/react-query';
import { Users, Crown, TrendingUp, Gift, UserCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { AdminStats, UserProfile } from '@/types';

function StatCard({
  label, value, sub, icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-[#2C3E50]">{value}</p>
        <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function OverviewSection() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
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
      };
    },
    staleTime: 30_000,
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery<UserProfile[]>({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      // Use Supabase directly for admin - no need for API caching
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, is_premium, created_at, referral_count, promo_code')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as UserProfile[];
    },
    staleTime: 30_000,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={36} className="text-[#8B0000] animate-spin" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-gray-600 font-semibold">Erreur de chargement des statistiques</p>
        <p className="text-gray-400 text-sm">Certaines tables Supabase n'existent peut-être pas encore. Voir l'onglet "Configuration".</p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={14} /> Réessayer
        </Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Utilisateurs Total', value: stats?.totalUsers ?? 0, icon: <Users size={22} />, color: 'text-[#2980B9]', bg: 'bg-[#2980B9]/10', sub: 'tous les inscrits' },
    { label: 'Utilisateurs Premium', value: stats?.premiumUsers ?? 0, icon: <Crown size={22} />, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', sub: 'accès complet' },
    { label: 'Utilisateurs Gratuits', value: stats?.freeUsers ?? 0, icon: <UserCheck size={22} />, color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10', sub: 'potentiel premium' },
    { label: 'Revenus Estimés', value: `${(stats?.estimatedRevenue ?? 0).toLocaleString('fr-FR')} FCFA`, icon: <TrendingUp size={22} />, color: 'text-[#8B0000]', bg: 'bg-[#8B0000]/10', sub: 'premium × 1 000 FCFA' },
    { label: 'Total Parrainages', value: stats?.totalReferrals ?? 0, icon: <Gift size={22} />, color: 'text-[#9B59B6]', bg: 'bg-[#9B59B6]/10', sub: 'filleuls référencés' },
    { label: 'Codes Promo Actifs', value: stats?.activePromoCodes ?? 0, icon: <Gift size={22} />, color: 'text-[#E67E22]', bg: 'bg-[#E67E22]/10', sub: 'codes disponibles' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-[#2C3E50] mb-1">Vue d'ensemble</h2>
        <p className="text-gray-500 text-sm">Statistiques générales de la plateforme Le Continent</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Conversion Rate */}
      {stats && stats.totalUsers > 0 && (
        <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Taux de conversion</p>
              <p className="text-4xl font-black">
                {((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%
              </p>
              <p className="text-white/60 text-sm mt-1">des utilisateurs sont Premium</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Objectif</p>
              <p className="text-2xl font-bold text-[#FFD700]">25%</p>
              <p className="text-white/60 text-xs mt-1">taux cible</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-[#FFD700] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.premiumUsers / stats.totalUsers) * 100 * 4)}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-extrabold text-[#2C3E50]">Derniers inscrits</h3>
          <span className="text-xs text-gray-400">8 derniers utilisateurs</span>
        </div>
        {usersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="text-[#8B0000] animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#8B0000]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#8B0000] font-bold text-sm">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C3E50] text-sm truncate">
                    {u.first_name} {u.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email || u.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.is_premium ? 'bg-[#FFD700]/20 text-[#8B0000]' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_premium ? '⭐ Premium' : 'Gratuit'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">Aucun utilisateur trouvé</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
