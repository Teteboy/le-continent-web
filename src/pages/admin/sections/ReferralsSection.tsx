import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReferralWithNames {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name: string;
  referred_phone: string;
  amount_paid: number;
  referral_earnings: number;
  created_at: string;
  referrer_first_name?: string;
  referrer_last_name?: string;
  referrer_phone?: string;
}

export default function ReferralsSection() {
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading, error, refetch } = useQuery<ReferralWithNames[]>({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      console.log('[Admin] Fetching referrals...');
      // First, just try to fetch the referrals table without join
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      console.log('[Admin] Referrals response:', { data, error });
      
      if (error) {
        console.error('[Admin] Referrals error:', error);
        throw error;
      }
      
      // If we have data, try to get referrer info separately
      if (data && data.length > 0) {
        const referrerIds = [...new Set(data.map(r => r.referrer_id).filter(Boolean))];
        if (referrerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, phone')
            .in('id', referrerIds);
          
          const profileMap = new Map((profiles || []).map(p => [p.id, p]));
          return data.map(r => ({
            ...r,
            referrer_first_name: profileMap.get(r.referrer_id)?.first_name,
            referrer_last_name: profileMap.get(r.referrer_id)?.last_name,
            referrer_phone: profileMap.get(r.referrer_id)?.phone,
          })) as ReferralWithNames[];
        }
      }
      return data as ReferralWithNames[];
    },
    staleTime: 30_000,
    retry: false,
  });

  const totalEarnings = referrals.reduce((acc, r) => acc + (r.referral_earnings ?? 0), 0);
  const paidReferrals = referrals.filter((r) => r.referral_earnings > 0);

  const topReferrers = Object.entries(
    referrals.reduce((acc, r) => {
      const key = r.referrer_id;
      if (!acc[key]) {
        acc[key] = {
          name: `${r.referrer_first_name || ''} ${r.referrer_last_name || ''}`.trim() || r.referrer_phone || key.slice(0, 8),
          count: 0,
          earnings: 0,
        };
      }
      acc[key].count += 1;
      acc[key].earnings += r.referral_earnings ?? 0;
      return acc;
    }, {} as Record<string, { name: string; count: number; earnings: number }>)
  )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const validateReferral = async (referralId: string, referrerId: string) => {
    try {
      // Update referral earnings to 500 FCFA
      const { error: referralError } = await supabase
        .from('referrals')
        .update({ referral_earnings: 500 })
        .eq('id', referralId);

      if (referralError) throw referralError;

      // Update referrer's balance
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', referrerId)
        .single();

      if (currentProfile) {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: (currentProfile.balance || 0) + 500 })
          .eq('id', referrerId);

        if (balanceError) throw balanceError;
      }

      toast.success('Parrainage validé !', {
        description: '500 FCFA ont été crédités au parrain.'
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err) {
      console.error('Error validating referral:', err);
      toast.error('Erreur lors de la validation', {
        description: (err as Error).message
      });
    }
  };

  const syncReferralEarnings = async () => {
    try {
      // Get all referrals with zero earnings
      const { data: pendingReferrals, error: fetchError } = await supabase
        .from('referrals')
        .select('id, referrer_id, referred_id')
        .eq('referral_earnings', 0);

      if (fetchError) throw fetchError;

      if (!pendingReferrals || pendingReferrals.length === 0) {
        toast.info('Aucun parrainage en attente trouvé');
        return;
      }

      let syncedCount = 0;

      for (const referral of pendingReferrals) {
        // Check if the referred user is now premium
        const { data: referredProfile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', referral.referred_id)
          .single();

        if (referredProfile?.is_premium) {
          // Update referral earnings
          const { error: updateError } = await supabase
            .from('referrals')
            .update({ referral_earnings: 500 })
            .eq('id', referral.id);

          if (!updateError) {
            // Update referrer balance
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('balance')
              .eq('id', referral.referrer_id)
              .single();

            if (referrerProfile && (referrerProfile.balance || 0) < 500) {
              await supabase
                .from('profiles')
                .update({ balance: (referrerProfile.balance || 0) + 500 })
                .eq('id', referral.referrer_id);
            }

            syncedCount++;
          }
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synchronisation terminée ! ${syncedCount} parrainage(s) mis à jour.`);
        queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      } else {
        toast.info('Aucun parrainage à synchroniser');
      }
    } catch (err) {
      console.error('Error syncing referrals:', err);
      toast.error('Erreur lors de la synchronisation', {
        description: (err as Error).message
      });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={36} className="text-[#8B0000] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertCircle size={48} className="text-red-500" />
      <p className="text-gray-600 font-semibold">Erreur: {(error as Error).message}</p>
      <p className="text-gray-400 text-sm max-w-xs">Vérifiez les politiques RLS ou exécutez: ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;</p>
      <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
        <RefreshCw size={14} /> Réessayer
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Parrainages</h2>
          <p className="text-gray-500 text-sm">{referrals.length} parrainages enregistrés</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncReferralEarnings} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw size={14} /> Synchroniser
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw size={14} /> Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total parrainages', value: referrals.length, icon: <Users size={20} />, color: 'text-[#2980B9]', bg: 'bg-[#2980B9]/10' },
          { label: 'Parrainages payants', value: paidReferrals.length, icon: <TrendingUp size={20} />, color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
          { label: 'Commissions versées', value: `${totalEarnings.toLocaleString('fr-FR')} FCFA`, icon: <TrendingUp size={20} />, color: 'text-[#8B0000]', bg: 'bg-[#8B0000]/10' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-black text-[#2C3E50]">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-extrabold text-[#2C3E50]">🏆 Top Parrains</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topReferrers.map(([, data], i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                  i === 0 ? 'bg-[#FFD700] text-[#8B0000]' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-300 text-orange-800' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#2C3E50] text-sm">{data.name}</p>
                  <p className="text-xs text-gray-400">{data.count} filleul{data.count > 1 ? 's' : ''}</p>
                </div>
                {data.earnings > 0 && (
                  <p className="text-sm font-bold text-[#27AE60]">{data.earnings.toLocaleString('fr-FR')} FCFA</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-extrabold text-[#2C3E50]">Historique complet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Parrain</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Filleul</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#2C3E50] text-sm">
                      {ref.referrer_first_name} {ref.referrer_last_name}
                    </p>
                    <p className="text-xs text-gray-400">{ref.referrer_phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#2C3E50] text-sm">{ref.referred_name}</p>
                    <p className="text-xs text-gray-400">{ref.referred_phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {ref.referral_earnings > 0 ? (
                      <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30 font-bold">
                        +{ref.referral_earnings} FCFA
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-gray-400">En attente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString('fr-FR')}</p>
                  </td>
                  <td className="px-4 py-3">
                    {ref.referral_earnings === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => validateReferral(ref.id, ref.referrer_id)}
                        className="bg-[#27AE60] hover:bg-[#219A52] text-white text-xs"
                      >
                        <Check size={12} className="mr-1" />
                        Valider
                      </Button>
                    ) : (
                      <Badge className="bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/30">
                        <Check size={10} className="mr-1" />
                        Validé
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Users size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun parrainage enregistré</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
