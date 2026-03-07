import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Crown, Loader2, RefreshCw, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';

type SortField = 'created_at' | 'first_name' | 'is_premium' | 'referral_count';
type SortDir = 'asc' | 'desc';

export default function UsersSection() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const qc = useQueryClient();

  const { data: users = [], isLoading, error, refetch } = useQuery<UserProfile[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as UserProfile[];
    },
    staleTime: 30_000,
  });

  const togglePremium = useMutation({
    mutationFn: async ({ userId, isPremium }: { userId: string; isPremium: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: isPremium,
          last_payment_date: isPremium ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { isPremium, userId }) => {
      toast.success(isPremium ? 'Utilisateur passé en Premium !' : 'Abonnement Premium révoqué');
      qc.setQueryData<UserProfile[]>(['admin-users'], (prev) =>
        prev?.map((u) => u.id === userId ? { ...u, is_premium: isPremium } : u) ?? []
      );
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  const filtered = users
    .filter((u) => {
      if (filter === 'premium' && !u.is_premium) return false;
      if (filter === 'free' && u.is_premium) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.promo_code?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortField === 'created_at') { av = a.created_at; bv = b.created_at; }
      if (sortField === 'first_name') { av = a.first_name ?? ''; bv = b.first_name ?? ''; }
      if (sortField === 'is_premium') { av = a.is_premium ? 1 : 0; bv = b.is_premium ? 1 : 0; }
      if (sortField === 'referral_count') { av = a.referral_count ?? 0; bv = b.referral_count ?? 0; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-gray-600">Erreur de chargement des utilisateurs</p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={14} /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Gestion des Utilisateurs</h2>
          <p className="text-gray-500 text-sm">{users.length} utilisateurs inscrits</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw size={14} /> Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, téléphone, code promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-[#8B0000]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'premium', 'free'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === f ? 'bg-[#8B0000] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#8B0000]/30'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'premium' ? '⭐ Premium' : 'Gratuits'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: users.length, color: 'text-[#2C3E50]' },
          { label: 'Premium', value: users.filter(u => u.is_premium).length, color: 'text-[#8B0000]' },
          { label: 'Résultats', value: filtered.length, color: 'text-[#27AE60]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => handleSort('first_name')} className="flex items-center gap-1 hover:text-[#8B0000]">
                    Utilisateur <SortIcon field="first_name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => handleSort('is_premium')} className="flex items-center gap-1 hover:text-[#8B0000]">
                    Statut <SortIcon field="is_premium" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  <button onClick={() => handleSort('referral_count')} className="flex items-center gap-1 hover:text-[#8B0000]">
                    Parrainages <SortIcon field="referral_count" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Code Promo</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-[#8B0000]">
                    Inscrit <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8B0000]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#8B0000] font-bold text-xs">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#2C3E50] text-sm truncate max-w-[130px]">
                          {user.first_name} {user.last_name}
                          {user.is_admin && <span className="ml-1 text-[10px] text-[#8B0000] font-bold">[ADMIN]</span>}
                        </p>
                        {user.tribe && <p className="text-xs text-gray-400 truncate">{user.tribe}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-600 truncate max-w-[160px]">{user.email || '—'}</p>
                    <p className="text-xs text-gray-400">{user.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.is_premium
                      ? 'bg-[#FFD700]/20 text-[#8B0000] border border-[#FFD700]/40 font-semibold'
                      : 'bg-gray-100 text-gray-500 font-semibold'}>
                      {user.is_premium ? <><Crown size={10} className="inline mr-1" />Premium</> : 'Gratuit'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-[#2C3E50]">{user.referral_count ?? 0}</span>
                    {(user.referral_earnings ?? 0) > 0 && (
                      <p className="text-xs text-[#27AE60] font-semibold">{user.referral_earnings} FCFA</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {user.promo_code || '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={user.is_premium}
                          onCheckedChange={(checked) => togglePremium.mutate({ userId: user.id, isPremium: checked })}
                          className="scale-75"
                        />
                        {user.is_premium
                          ? <CheckCircle size={13} className="text-[#27AE60]" />
                          : <XCircle size={13} className="text-gray-300" />}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    {search ? `Aucun utilisateur pour "${search}"` : 'Aucun utilisateur trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Affichage de {filtered.length} / {users.length} utilisateurs
          </p>
          <p className="text-xs text-gray-400">Le toggle active/désactive le Premium</p>
        </div>
      </div>
    </div>
  );
}
