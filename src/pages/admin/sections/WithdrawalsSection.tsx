import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_email?: string;
  user_phone?: string;
}

export default function WithdrawalsSection() {
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const qc = useQueryClient();

  const { data: withdrawals = [], isLoading, error, refetch } = useQuery<WithdrawalRequest[]>({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      // For now, return empty array since no withdrawals table
      // In production, query the withdrawals table
      return [];
    },
    staleTime: 30_000,
  });

  const updateWithdrawal = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      // In production, update the withdrawal status
      // For now, just simulate
      toast.success(`Retrait ${status === 'approved' ? 'approuvé' : 'rejeté'}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setSelectedRequest(null);
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={36} className="text-[#8B0000] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={48} className="text-red-500" />
      <p className="text-gray-600">Erreur de chargement des retraits</p>
      <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
        <RefreshCw size={14} /> Réessayer
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Demandes de Retrait</h2>
          <p className="text-gray-500 text-sm">{withdrawals.length} demandes en attente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-[#8B0000]" />
                  <span className="font-bold text-[#2C3E50]">{withdrawal.amount} FCFA</span>
                </div>
                <Badge 
                  className={`${
                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {withdrawal.status === 'pending' ? 'En attente' :
                   withdrawal.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Utilisateur: {withdrawal.user_email || withdrawal.user_phone || withdrawal.user_id}
              </p>
              <p className="text-xs text-gray-400">
                Demandé le {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
              </p>
              {withdrawal.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => updateWithdrawal.mutate({ id: withdrawal.id, status: 'approved' })}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <Check size={14} /> Approuver
                  </Button>
                  <Button
                    onClick={() => updateWithdrawal.mutate({ id: withdrawal.id, status: 'rejected' })}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                  >
                    <X size={14} /> Rejeter
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {withdrawals.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune demande de retrait</p>
          </div>
        )}
      </div>
    </div>
  );
}