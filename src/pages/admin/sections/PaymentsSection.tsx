import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Crown, Loader2, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Clock, Search, X, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Payment {
  id: string;
  user_id: string | null;
  amount: number;
  original_amount: number;
  payment_method: 'mtn' | 'orange' | null;
  phone_number: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_reference: string | null;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Confirmé', color: 'bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/30', icon: <CheckCircle size={11} /> },
  pending:   { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={11} /> },
  failed:    { label: 'Échoué', color: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle size={11} /> },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <XCircle size={11} /> },
  refunded:  { label: 'Remboursé', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <RefreshCw size={11} /> },
};

export default function PaymentsSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  // Fetch payments joined with profiles
  const { data: payments = [], isLoading, error, refetch } = useQuery<Payment[]>({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profile:profiles!user_id (
            first_name, last_name, email, phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
    staleTime: 30_000,
  });

  // Manually mark a payment as completed (admin override)
  const confirmPayment = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!payment.user_id) throw new Error('Aucun utilisateur associé au paiement');

      // Update payment status in DB
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      if (paymentError) throw paymentError;

      // Activate premium for user
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast.success('Paiement confirmé et Premium activé !');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la confirmation'),
  });

  // Computed stats
  const totalCompleted = payments.filter((p) => p.status === 'completed').length;
  const totalPending   = payments.filter((p) => p.status === 'pending').length;
  const totalFailed    = payments.filter((p) => p.status === 'failed' || p.status === 'cancelled').length;
  const totalRevenue   = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + (p.amount ?? 0), 0);

  // Filter + search
  const filtered = payments.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.phone_number?.toLowerCase().includes(q) ||
      p.payment_reference?.toLowerCase().includes(q) ||
      (p.profile as Payment['profile'])?.first_name?.toLowerCase().includes(q) ||
      (p.profile as Payment['profile'])?.last_name?.toLowerCase().includes(q) ||
      (p.profile as Payment['profile'])?.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={36} className="text-[#8B0000] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-gray-600 font-semibold">Erreur de chargement des paiements</p>
        <p className="text-gray-400 text-sm">
          La table <code className="bg-gray-100 px-1 rounded">payments</code> doit exister dans Supabase.
        </p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={14} /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Historique des Paiements</h2>
          <p className="text-gray-500 text-sm">{payments.length} paiement(s) enregistré(s)</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="flex items-center gap-2 shrink-0">
          <RefreshCw size={14} /> Actualiser
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Complétés',     value: totalCompleted, icon: <CheckCircle size={20} />, color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
          { label: 'En attente',    value: totalPending,   icon: <Clock size={20} />,        color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Échoués',       value: totalFailed,    icon: <XCircle size={20} />,      color: 'text-red-500',    bg: 'bg-red-50' },
          { label: 'Revenus (XAF)', value: `${totalRevenue.toLocaleString('fr-FR')} F`, icon: <TrendingUp size={20} />, color: 'text-[#8B0000]', bg: 'bg-[#8B0000]/10' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Rechercher par nom, email, téléphone, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-[#8B0000]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'completed', 'pending', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === f
                  ? 'bg-[#8B0000] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#8B0000]/30'
              }`}
            >
              {f === 'all' ? 'Tous' : STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Opérateur</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Référence</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((payment) => {
                const st = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG['failed'];
                const prof = payment.profile as Payment['profile'];
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#8B0000]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#8B0000] font-bold text-xs">
                            {prof?.first_name?.[0] ?? '?'}{prof?.last_name?.[0] ?? ''}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#2C3E50] text-xs truncate max-w-[120px]">
                            {prof ? `${prof.first_name} ${prof.last_name}` : 'Utilisateur inconnu'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{payment.phone_number || prof?.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {payment.payment_method ? (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={`/${payment.payment_method}.webp`}
                            alt={payment.payment_method}
                            className="h-5 object-contain"
                          />
                          <span className="text-xs text-gray-600 font-semibold uppercase">{payment.payment_method}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#2C3E50] text-sm">{(payment.amount ?? 0).toLocaleString('fr-FR')} F</p>
                      {payment.promo_code && (
                        <p className="text-[10px] text-[#27AE60] font-semibold">🎟 {payment.promo_code}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] font-bold border flex items-center gap-1 w-fit ${st.color}`}>
                        {st.icon}
                        {st.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 max-w-[140px] block truncate">
                        {payment.payment_reference ?? '—'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(payment.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'pending' && payment.user_id && (
                        <Button
                          size="sm"
                          onClick={() => confirmPayment.mutate(payment)}
                          disabled={confirmPayment.isPending}
                          className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold text-xs h-8 flex items-center gap-1"
                        >
                          {confirmPayment.isPending ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Crown size={11} />
                          )}
                          Confirmer
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <span className="text-[10px] text-[#27AE60] font-semibold flex items-center gap-1">
                          <CheckCircle size={11} /> Premium actif
                        </span>
                      )}
                      {(payment.status === 'failed' || payment.status === 'cancelled') && (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-400 text-sm">
                    <CreditCard size={36} className="text-gray-200 mx-auto mb-3" />
                    {search ? `Aucun paiement pour "${search}"` : 'Aucun paiement enregistré'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
          <p className="text-xs text-gray-400">
            {filtered.length} / {payments.length} paiement(s) affiché(s)
          </p>
          <p className="text-xs text-gray-400">
            Le bouton "Confirmer" active manuellement le Premium pour les paiements en attente
          </p>
        </div>
      </div>
    </div>
  );
}
