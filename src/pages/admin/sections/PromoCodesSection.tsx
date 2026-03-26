import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Loader2, AlertCircle, RefreshCw, Trash2, Copy, Check,
  X, Save, Tag, CheckCircle, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { PromoCode } from '@/types';

interface PromoForm {
  code: string;
  description: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  max_uses: string;
  expires_at: string;
}

const emptyForm: PromoForm = {
  code: '',
  description: '',
  discount_type: 'fixed',
  discount_value: '',
  max_uses: '',
  expires_at: '',
};

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PROMO-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function calcFinalPrice(code: PromoCode): number {
  if (code.discount_type === 'fixed') return Math.max(0, 1000 - code.discount_value);
  return Math.max(0, 1000 - Math.floor(1000 * code.discount_value / 100));
}

export default function PromoCodesSection() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: codes = [], isLoading, error, refetch } = useQuery<PromoCode[]>({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PromoCode[];
    },
    staleTime: 30_000,
    retry: false,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error('Le code est requis');
      const val = parseInt(form.discount_value);
      if (isNaN(val) || val <= 0) throw new Error('La valeur de réduction doit être positive');
      if (form.discount_type === 'percentage' && val > 100) throw new Error('Le pourcentage ne peut pas dépasser 100%');

      const { error } = await supabase.from('promo_codes').insert({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: val,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        used_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Code promo créé !');
      qc.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la création'),
  });

  const toggleCode = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id, isActive }) => {
      toast.success(isActive ? 'Code activé' : 'Code désactivé');
      qc.setQueryData<PromoCode[]>(['admin-promo-codes'], (prev) =>
        prev?.map((c) => c.id === id ? { ...c, is_active: isActive } : c) ?? []
      );
    },
    onError: () => toast.error('Erreur'),
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Code supprimé');
      qc.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Code copié !');
  };

  const isTableMissing = error && (error as Error).message?.includes('does not exist');

  // Show error details for debugging
  const errorMessage = error ? (error as Error).message : '';

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={36} className="text-[#8B0000] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Codes Promo</h2>
          <p className="text-gray-500 text-sm">Créez des codes de réduction pour vos utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw size={14} /> Actualiser
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Créer un code
          </Button>
        </div>
      </div>

      {isTableMissing ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertCircle size={40} className="text-amber-500 mx-auto mb-3" />
          <h3 className="font-extrabold text-amber-800 mb-2">Table "promo_codes" inexistante</h3>
          <p className="text-amber-700 text-sm mb-4">
            La table n'existe pas encore dans Supabase. Exécutez le script SQL dans l'onglet Configuration.
          </p>
        </div>
      ) : error && !isTableMissing ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle size={48} className="text-red-500" />
          <p className="text-gray-600 font-semibold">Erreur: {errorMessage}</p>
          <p className="text-gray-400 text-sm">Vérifiez les politiques RLS dans Supabase</p>
          <p className="text-xs text-gray-300 bg-gray-100 p-2 rounded font-mono max-w-md text-center">
            Essayez: ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;
          </p>
          <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
            <RefreshCw size={14} /> Réessayer
          </Button>
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <Tag size={40} className="text-amber-500 mx-auto mb-3" />
          <h3 className="font-extrabold text-amber-800 mb-2">Aucun code promo</h3>
          <p className="text-amber-700 text-sm mb-4">
            Créez votre premier code promo pour vos utilisateurs
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold"
          >
            <Plus size={16} className="mr-2" /> Créer un code
          </Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: codes.length },
              { label: 'Actifs', value: codes.filter(c => c.is_active).length },
              { label: 'Utilisations', value: codes.reduce((acc, c) => acc + c.used_count, 0) },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-xl font-black text-[#8B0000]">{s.value}</p>
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
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Réduction</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Prix Final</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Utilisations</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Expiration</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((code) => {
                    const finalPrice = calcFinalPrice(code);
                    const isExpired = code.expires_at ? new Date(code.expires_at) < new Date() : false;
                    const isMaxed = code.max_uses !== null && code.used_count >= code.max_uses;
                    return (
                      <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="font-black text-[#8B0000] bg-[#8B0000]/5 px-2 py-1 rounded text-sm">
                              {code.code}
                            </code>
                            <button onClick={() => handleCopy(code.code)} className="text-gray-400 hover:text-[#8B0000]">
                              {copied === code.code ? <Check size={13} className="text-[#27AE60]" /> : <Copy size={13} />}
                            </button>
                          </div>
                          {code.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">{code.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge className={`font-bold ${code.discount_type === 'percentage' ? 'bg-[#2980B9]/10 text-[#2980B9]' : 'bg-[#27AE60]/10 text-[#27AE60]'}`}>
                            {code.discount_type === 'percentage' ? `-${code.discount_value}%` : `-${code.discount_value} FCFA`}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div>
                            <p className="font-bold text-[#27AE60] text-sm">{finalPrice.toLocaleString('fr-FR')} FCFA</p>
                            <p className="text-xs text-gray-400 line-through">1 000 FCFA</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#2C3E50]">
                            {code.used_count}{code.max_uses !== null ? `/${code.max_uses}` : ''}
                          </p>
                          {isMaxed && <p className="text-xs text-red-500">Épuisé</p>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {code.expires_at ? (
                            <p className={`text-xs font-semibold ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                              {isExpired ? '⚠️ ' : ''}{new Date(code.expires_at).toLocaleDateString('fr-FR')}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400">Pas d'expiration</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={code.is_active && !isExpired && !isMaxed}
                              disabled={isExpired || isMaxed}
                              onCheckedChange={(checked) => toggleCode.mutate({ id: code.id, isActive: checked })}
                              className="scale-75"
                            />
                            {code.is_active && !isExpired && !isMaxed
                              ? <CheckCircle size={13} className="text-[#27AE60]" />
                              : <XCircle size={13} className="text-gray-300" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteTarget(code)}
                            className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {codes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Tag size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Aucun code promo créé</p>
                        <button onClick={() => setShowForm(true)} className="text-[#8B0000] text-sm font-semibold hover:underline mt-2">
                          Créer votre premier code →
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setForm(emptyForm); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#8B0000]">Créer un code promo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">Code <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="ex: LAUNCH50"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="border-[#8B0000]/40 focus-visible:ring-[#8B0000] font-mono font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                  className="shrink-0 border-[#8B0000]/30 text-[#8B0000]"
                >
                  Auto
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">Description (optionnel)</Label>
              <Input
                placeholder="ex: Offre de lancement"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">Type de réduction</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as 'fixed' | 'percentage' }))}>
                  <SelectTrigger className="mt-1 border-[#8B0000]/40 focus:ring-[#8B0000]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">
                  Valeur {form.discount_type === 'percentage' ? '(%)' : '(FCFA)'}
                </Label>
                <Input
                  type="number"
                  placeholder={form.discount_type === 'percentage' ? '50' : '500'}
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                />
              </div>
            </div>
            {/* Preview */}
            {form.discount_value && parseInt(form.discount_value) > 0 && (
              <div className="bg-[#27AE60]/10 border border-[#27AE60]/30 rounded-xl p-3 text-sm">
                <p className="text-[#27AE60] font-semibold">Aperçu :</p>
                <p className="text-gray-700">
                  Prix original : <span className="line-through text-gray-400">1 000 FCFA</span>
                  {' → '}
                  <span className="font-black text-[#27AE60]">
                    {form.discount_type === 'fixed'
                      ? Math.max(0, 1000 - parseInt(form.discount_value)).toLocaleString('fr-FR')
                      : Math.max(0, 1000 - Math.floor(1000 * parseInt(form.discount_value) / 100)).toLocaleString('fr-FR')
                    } FCFA
                  </span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">Utilisations max</Label>
                <Input
                  type="number"
                  placeholder="Illimité"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                />
              </div>
              <div>
                <Label className="text-[#8B0000] font-semibold text-sm">Expiration</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => { setShowForm(false); setForm(emptyForm); }} variant="outline" className="flex-1 flex items-center gap-2">
                <X size={14} /> Annuler
              </Button>
              <Button
                onClick={() => createCode.mutate()}
                disabled={createCode.isPending || !form.code.trim()}
                className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-2"
              >
                {createCode.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Créer le code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-red-600">Supprimer ce code ?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-gray-600 text-sm">
              Voulez-vous supprimer le code <code className="font-black text-[#8B0000]">{deleteTarget?.code}</code> ?
              {(deleteTarget?.used_count ?? 0) > 0 && (
                <span className="block mt-1 text-amber-600">⚠️ Ce code a déjà été utilisé {deleteTarget?.used_count} fois.</span>
              )}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteTarget(null)} variant="outline" className="flex-1">Annuler</Button>
              <Button
                onClick={() => deleteTarget && deleteCode.mutate(deleteTarget.id)}
                disabled={deleteCode.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2"
              >
                {deleteCode.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
