import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, RefreshCw, MapPin, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Village {
  id: string;
  name: string;
  region: string;
  image_url: string | null;
  order: number;
  created_at: string;
}

interface VillageForm {
  name: string;
  region: string;
  image_url: string;
}

const emptyForm: VillageForm = { name: '', region: '', image_url: '' };

export default function VillagesSection() {
  const [showForm, setShowForm] = useState(false);
  const [editVillage, setEditVillage] = useState<Village | null>(null);
  const [form, setForm] = useState<VillageForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Village | null>(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: villages = [], isLoading, error, refetch } = useQuery<Village[]>({
    queryKey: ['admin-villages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('villages')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Village[];
    },
    staleTime: 30_000,
  });

  const openAdd = () => { setForm(emptyForm); setEditVillage(null); setShowForm(true); };
  const openEdit = (v: Village) => {
    setForm({ name: v.name, region: v.region ?? '', image_url: v.image_url ?? '' });
    setEditVillage(v);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditVillage(null); setForm(emptyForm); };

  const saveVillage = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Le nom est requis');
      if (editVillage) {
        const { error } = await supabase.from('villages').update({
          name: form.name.trim(),
          region: form.region.trim() || null,
          image_url: form.image_url.trim() || null,
        }).eq('id', editVillage.id);
        if (error) throw error;
      } else {
        const maxOrder = villages.reduce((max, v) => Math.max(max, v.order ?? 0), 0);
        const { error } = await supabase.from('villages').insert({
          name: form.name.trim(),
          region: form.region.trim() || null,
          image_url: form.image_url.trim() || null,
          order: maxOrder + 1,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editVillage ? 'Village mis à jour !' : 'Village ajouté !');
      qc.invalidateQueries({ queryKey: ['admin-villages'] });
      closeForm();
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la sauvegarde'),
  });

  const deleteVillage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('villages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Village supprimé');
      qc.invalidateQueries({ queryKey: ['admin-villages'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: string; order: number }) => {
      const { error } = await supabase.from('villages').update({ order }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-villages'] }),
    onError: () => toast.error('Erreur lors de la mise à jour de l\'ordre'),
  });

  const filtered = villages.filter((v) =>
    !search.trim() ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.region?.toLowerCase().includes(search.toLowerCase())
  );

  const moveUp = (village: Village) => {
    const currentIndex = villages.findIndex(v => v.id === village.id);
    if (currentIndex === 0) return;
    const prevVillage = villages[currentIndex - 1];
    updateOrderMutation.mutate({ id: village.id, order: prevVillage.order });
    updateOrderMutation.mutate({ id: prevVillage.id, order: village.order });
  };

  const moveDown = (village: Village) => {
    const currentIndex = villages.findIndex(v => v.id === village.id);
    if (currentIndex === villages.length - 1) return;
    const nextVillage = villages[currentIndex + 1];
    updateOrderMutation.mutate({ id: village.id, order: nextVillage.order });
    updateOrderMutation.mutate({ id: nextVillage.id, order: village.order });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={36} className="text-[#8B0000] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={48} className="text-red-500" />
      <p className="text-gray-600">Erreur de chargement des villages</p>
      <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
        <RefreshCw size={14} /> Réessayer
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C3E50]">Gestion des Villages / Cultures</h2>
          <p className="text-gray-500 text-sm">{villages.length} cultures disponibles</p>
        </div>
        <Button onClick={openAdd} className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-2">
          <Plus size={16} /> Ajouter un village
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Rechercher un village ou une région..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-gray-200 focus-visible:ring-[#8B0000]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((village) => (
          <div key={village.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-32 bg-gray-100">
              <img
                src={village.image_url || 'https://flagcdn.com/w320/cm.png'}
                alt={village.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w320/cm.png'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-white font-extrabold text-base drop-shadow">{village.name.split(' (')[0]}</p>
              </div>
            </div>
            <div className="p-4">
              {village.region && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin size={11} className="text-[#8B0000]" /> {village.region}
                </p>
              )}
              <p className="text-xs text-gray-400 mb-3">
                Ajouté le {new Date(village.created_at).toLocaleDateString('fr-FR')}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => moveUp(village)}
                  variant="outline"
                  size="sm"
                  disabled={filtered.findIndex(v => v.id === village.id) === 0}
                  className="px-2 border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  ↑
                </Button>
                <Button
                  onClick={() => openEdit(village)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white flex items-center gap-1.5"
                >
                  <Pencil size={13} /> Modifier
                </Button>
                <Button
                  onClick={() => moveDown(village)}
                  variant="outline"
                  size="sm"
                  disabled={filtered.findIndex(v => v.id === village.id) === filtered.length - 1}
                  className="px-2 border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  ↓
                </Button>
                <Button
                  onClick={() => setDeleteTarget(village)}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun village trouvé</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#8B0000]">
              {editVillage ? `Modifier — ${editVillage.name.split(' (')[0]}` : 'Ajouter un village'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">
                Nom du village / culture <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="ex: Les Bamiléké"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
              />
            </div>
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">Région</Label>
              <Input
                placeholder="ex: Région de l'Ouest"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
              />
            </div>
            <div>
              <Label className="text-[#8B0000] font-semibold text-sm">URL de l'image</Label>
              <Input
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="mt-1 border-[#8B0000]/40 focus-visible:ring-[#8B0000]"
              />
              {form.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden h-24 bg-gray-100">
                  <img src={form.image_url} alt="Aperçu" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le drapeau du Cameroun</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={closeForm} variant="outline" className="flex-1 flex items-center gap-2">
                <X size={14} /> Annuler
              </Button>
              <Button
                onClick={() => saveVillage.mutate()}
                disabled={saveVillage.isPending || !form.name.trim()}
                className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-2"
              >
                {saveVillage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editVillage ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-red-600">Supprimer ce village ?</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-gray-600 text-sm">
              Voulez-vous vraiment supprimer <strong>{deleteTarget?.name}</strong> ?
              Cette action supprimera aussi tout le contenu associé (proverbes, lexique, etc.).
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteTarget(null)} variant="outline" className="flex-1">Annuler</Button>
              <Button
                onClick={() => deleteTarget && deleteVillage.mutate(deleteTarget.id)}
                disabled={deleteVillage.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2"
              >
                {deleteVillage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
