import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, X, Save, Database, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;
const READONLY_COLS = new Set(['id', 'created_at', 'updated_at']);

const TABLES = [
  { name: 'alphabet',       label: 'Alphabet',         emoji: '🔤' },
  { name: 'cultures_books', label: 'Livres & Cultures', emoji: '📚' },
  { name: 'histoires',      label: 'Histoires',         emoji: '📖' },
  { name: 'lexique',        label: 'Lexique',           emoji: '📝' },
  { name: 'mets',           label: 'Mets',              emoji: '🍽️' },
  { name: 'phrases',        label: 'Phrases',           emoji: '💬' },
  { name: 'proverbes',      label: 'Proverbes',         emoji: '✨' },
  { name: 'subscriptions',  label: 'Abonnements',       emoji: '💳' },
  { name: 'transactions',   label: 'Transactions',      emoji: '💰' },
  { name: 'villages',       label: 'Villages',          emoji: '🏘️' },
] as const;

type TableName = typeof TABLES[number]['name'];
type ColType = 'id' | 'readonly' | 'boolean' | 'number' | 'text' | 'longtext' | 'url' | 'datetime';
type Row = Record<string, unknown>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferColType(key: string, value: unknown): ColType {
  if (key === 'id') return 'id';
  if (READONLY_COLS.has(key)) return 'readonly';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) return 'url';
    if (value.match(/^\d{4}-\d{2}-\d{2}T/)) return 'datetime';
    const isLong = value.length > 100
      || ['content', 'text', 'description', 'story', 'body', 'summary', 'meaning', 'ingredients'].some(p => key.toLowerCase().includes(p));
    if (isLong) return 'longtext';
    return 'text';
  }
  return 'text';
}

function formatCellValue(value: unknown, key: string): string {
  if (value === null || value === undefined) return '—';
  if (key === 'id') return `${String(value).slice(0, 8)}…`;
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleDateString('fr-FR');
  }
  const str = String(value);
  return str.length > 55 ? `${str.slice(0, 55)}…` : str;
}

// ─── FieldEditor ─────────────────────────────────────────────────────────────

interface FieldEditorProps {
  colKey: string;
  value: unknown;
  colType: ColType;
  onChange: (v: unknown) => void;
}

function FieldEditor({ colKey, value, colType, onChange }: FieldEditorProps) {
  const label = colKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (colType === 'id' || colType === 'readonly' || colType === 'datetime') {
    return (
      <div>
        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {label} <span className="text-gray-300 font-normal">(lecture seule)</span>
        </Label>
        <p className="mt-1 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 font-mono break-all min-h-[38px]">
          {value === null || value === undefined ? '—' : String(value)}
        </p>
      </div>
    );
  }

  if (colType === 'boolean') {
    return (
      <div className="flex items-center justify-between py-1">
        <Label className="text-sm font-semibold text-[#2C3E50]">{label}</Label>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  if (colType === 'number') {
    return (
      <div>
        <Label className="text-sm font-semibold text-[#2C3E50]">{label}</Label>
        <Input
          type="number"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 border-[#8B0000]/30 focus-visible:ring-[#8B0000]"
        />
      </div>
    );
  }

  if (colType === 'longtext') {
    return (
      <div>
        <Label className="text-sm font-semibold text-[#2C3E50]">{label}</Label>
        <Textarea
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value || null)}
          rows={4}
          className="mt-1 border-[#8B0000]/30 focus-visible:ring-[#8B0000] text-sm resize-y"
          placeholder={`Saisir ${label.toLowerCase()}…`}
        />
      </div>
    );
  }

  // text / url
  return (
    <div>
      <Label className="text-sm font-semibold text-[#2C3E50]">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value || null)}
          className="border-[#8B0000]/30 focus-visible:ring-[#8B0000]"
          placeholder={colType === 'url' ? 'https://…' : `Saisir ${label.toLowerCase()}…`}
        />
        {colType === 'url' && value && (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center px-2 text-[#2980B9] hover:text-[#1A6091]"
            title="Ouvrir le lien"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── DataSection ─────────────────────────────────────────────────────────────

export default function DataSection() {
  const [selectedTable, setSelectedTable] = useState<TableName>('alphabet');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [textCols, setTextCols] = useState<string[]>([]);

  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editData, setEditData] = useState<Row>({});
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const qc = useQueryClient();

  // Reset on table change
  useEffect(() => {
    setPage(0);
    setSearch('');
    setSearchInput('');
    setTextCols([]);
  }, [selectedTable]);

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-data', selectedTable, page, search, textCols.join(',')],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any).from(selectedTable).select('*', { count: 'exact' });

      if (search.trim() && textCols.length > 0) {
        const orStr = textCols.map((c) => `${c}.ilike.%${search}%`).join(',');
        q = q.or(orStr);
      }

      const { data, count, error } = await q.range(from, to);
      if (error) throw new Error(error.message);

      return { rows: (data ?? []) as Row[], count: (count ?? 0) as number };
    },
    staleTime: 10_000,
  });

  // Auto-discover text columns from first loaded row
  useEffect(() => {
    if (result?.rows && result.rows.length > 0 && textCols.length === 0) {
      const firstRow = result.rows[0];
      const discovered = Object.entries(firstRow)
        .filter(([k, v]) =>
          typeof v === 'string' &&
          !READONLY_COLS.has(k) &&
          !k.endsWith('_id') &&
          !k.endsWith('_url')
        )
        .map(([k]) => k)
        .slice(0, 4);
      if (discovered.length > 0) setTextCols(discovered);
    }
  }, [result?.rows, textCols.length]);

  const rows = result?.rows ?? [];
  const totalCount = result?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Derive column metadata from first row
  const allColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colTypes: Record<string, ColType> = {};
  if (rows.length > 0) {
    for (const [k, v] of Object.entries(rows[0])) {
      colTypes[k] = inferColType(k, v);
    }
  }

  // Columns sorted: editable first, readonly last
  const sortedColumns = [...allColumns].sort((a, b) => {
    const aRO = READONLY_COLS.has(a) || a === 'id';
    const bRO = READONLY_COLS.has(b) || b === 'id';
    return aRO === bRO ? 0 : aRO ? 1 : -1;
  });

  // Visible table columns: limit to 7 for readability
  const visibleColumns = allColumns.slice(0, 7);

  // ── Edit / Add handlers ───────────────────────────────────────────────────

  const openEdit = (row: Row) => {
    setIsAdding(false);
    setEditRow(row);
    setEditData({ ...row });
  };

  const openAdd = () => {
    if (allColumns.length === 0) {
      toast.error('Chargez d\'abord les données de la table');
      return;
    }
    const emptyRow: Row = {};
    for (const col of allColumns) {
      if (READONLY_COLS.has(col) || col === 'id') continue;
      const type = colTypes[col] ?? 'text';
      emptyRow[col] = type === 'boolean' ? false : type === 'number' ? 0 : null;
    }
    setIsAdding(true);
    setEditRow(null);
    setEditData(emptyRow);
  };

  const closeDialog = () => {
    setIsAdding(false);
    setEditRow(null);
    setEditData({});
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveRow = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const [k, v] of Object.entries(editData)) {
        if (k !== 'id' && !READONLY_COLS.has(k)) payload[k] = v;
      }
      payload.updated_at = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      if (isAdding) {
        payload.created_at = new Date().toISOString();
        const { error } = await sb.from(selectedTable).insert(payload);
        if (error) throw new Error(error.message);
      } else {
        const rowId = editRow?.id;
        if (!rowId) throw new Error('ID de ligne introuvable');
        const { error } = await sb.from(selectedTable).update(payload).eq('id', rowId);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(isAdding ? 'Ligne ajoutée !' : 'Modifications sauvegardées !');
      qc.invalidateQueries({ queryKey: ['admin-data', selectedTable] });
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la sauvegarde'),
  });

  const deleteRow = useMutation({
    mutationFn: async (row: Row) => {
      if (!row.id) throw new Error('ID introuvable — suppression impossible');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from(selectedTable).delete().eq('id', row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Ligne supprimée');
      qc.invalidateQueries({ queryKey: ['admin-data', selectedTable] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
    setPage(0);
  };

  // ─── Pagination numbers ───────────────────────────────────────────────────

  const pageNumbers = (() => {
    const windowSize = 5;
    if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, i) => i);
    const half = Math.floor(windowSize / 2);
    let start = Math.max(0, page - half);
    const end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  const currentTableInfo = TABLES.find((t) => t.name === selectedTable)!;

  return (
    <div className="flex gap-6 flex-col lg:flex-row">

      {/* ── Table Selector (sidebar) ────────────────────────────────────── */}
      <div className="w-full lg:w-52 shrink-0">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Tables Supabase
        </p>
        <div className="flex flex-row lg:flex-col gap-1.5 flex-wrap lg:flex-nowrap">
          {TABLES.map((t) => {
            const active = selectedTable === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${
                  active
                    ? 'bg-[#8B0000] text-white shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-600 hover:border-[#8B0000]/30 hover:text-[#8B0000]'
                }`}
              >
                <span className="text-base leading-none">{t.emoji}</span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Info box */}
        <div className="mt-4 bg-[#FFF8DC] border border-[#FFD700]/40 rounded-xl p-3 hidden lg:block">
          <p className="text-xs text-[#8B0000] font-bold mb-1">💡 Astuce</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Cliquez sur ✎ pour modifier une ligne, ou sur + Ajouter pour créer une nouvelle entrée.
          </p>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-[#2C3E50]">
              {currentTableInfo.emoji} {currentTableInfo.label}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isLoading
                ? 'Chargement…'
                : `${totalCount.toLocaleString('fr-FR')} ligne(s) · Page ${page + 1} / ${totalPages}`}
              {search && (
                <span className="ml-2 text-[#8B0000] font-semibold">
                  · Recherche : «{search}»
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Actualiser
            </Button>
            <Button
              onClick={openAdd}
              size="sm"
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-1.5"
            >
              <Plus size={14} /> Ajouter
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              placeholder={`Rechercher dans ${currentTableInfo.label.toLowerCase()}…`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 border-gray-200 focus-visible:ring-[#8B0000]"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="sm" className="shrink-0">
            Chercher
          </Button>
          {search && (
            <Button onClick={clearSearch} variant="ghost" size="sm" className="shrink-0 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Hint when textCols are not yet detected */}
        {search && textCols.length === 0 && !isLoading && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
            <AlertCircle size={13} className="shrink-0" />
            Chargez d'abord les données (sans recherche) pour activer la recherche textuelle.
          </div>
        )}

        {/* Table or states */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={36} className="text-[#8B0000] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-gray-100">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-gray-600 text-sm font-semibold">{(error as Error).message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCw size={13} /> Réessayer
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
            <Database size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? `Aucun résultat pour «${search}»` : 'Table vide'}
            </p>
            {search && (
              <button onClick={clearSearch} className="text-[#8B0000] text-sm font-semibold hover:underline mt-2">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Data table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {visibleColumns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                      {allColumns.length > 7 && (
                        <th className="px-3 py-3 text-xs font-bold text-gray-300 uppercase tracking-wide">
                          +{allColumns.length - 7} cols
                        </th>
                      )}
                      <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row, i) => (
                      <tr
                        key={String(row.id ?? i)}
                        className="hover:bg-[#8B0000]/[0.02] transition-colors"
                      >
                        {visibleColumns.map((col) => (
                          <td key={col} className="px-3 py-2.5 max-w-[180px]">
                            {colTypes[col] === 'boolean' ? (
                              <Badge
                                className={`text-xs font-bold ${
                                  row[col]
                                    ? 'bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {row[col] ? 'Oui' : 'Non'}
                              </Badge>
                            ) : (
                              <span
                                className="block truncate text-xs text-gray-700"
                                title={row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                              >
                                {formatCellValue(row[col], col)}
                              </span>
                            )}
                          </td>
                        ))}
                        {allColumns.length > 7 && <td className="px-3 py-2.5" />}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(row)}
                              title="Modifier"
                              className="p-1.5 text-gray-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5 rounded-lg transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              title="Supprimer"
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
                <p className="text-xs text-gray-400">
                  {rows.length} ligne(s) affichée(s) sur {totalCount.toLocaleString('fr-FR')}
                </p>
                {allColumns.length > 7 && (
                  <p className="text-xs text-gray-400">
                    Cliquez ✎ pour voir toutes les colonnes
                  </p>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5">
                <Button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Précédent
                </Button>

                <div className="flex items-center gap-1">
                  {pageNumbers[0] > 0 && (
                    <>
                      <button
                        onClick={() => setPage(0)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        1
                      </button>
                      {pageNumbers[0] > 1 && <span className="text-gray-300 text-xs px-1">…</span>}
                    </>
                  )}
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        p === page
                          ? 'bg-[#8B0000] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p + 1}
                    </button>
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && (
                        <span className="text-gray-300 text-xs px-1">…</span>
                      )}
                      <button
                        onClick={() => setPage(totalPages - 1)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  Suivant <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit / Add Dialog ────────────────────────────────────────────── */}
      <Dialog open={isAdding || editRow !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#8B0000]">
              {isAdding
                ? `+ Nouvelle ligne — ${currentTableInfo.label}`
                : `Modifier — ${currentTableInfo.label}`}
            </DialogTitle>
            {!isAdding && editRow?.id && (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                ID : {String(editRow.id)}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Editable fields */}
            {sortedColumns
              .filter((col) => !READONLY_COLS.has(col) && col !== 'id')
              .map((col) => (
                <FieldEditor
                  key={col}
                  colKey={col}
                  value={editData[col]}
                  colType={colTypes[col] ?? 'text'}
                  onChange={(v) => setEditData((d) => ({ ...d, [col]: v }))}
                />
              ))}

            {/* Readonly fields (only in edit mode) */}
            {!isAdding && (
              <>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Champs système (lecture seule)
                  </p>
                  <div className="space-y-3">
                    {sortedColumns
                      .filter((col) => READONLY_COLS.has(col) || col === 'id')
                      .map((col) => (
                        <FieldEditor
                          key={col}
                          colKey={col}
                          value={editData[col]}
                          colType={colTypes[col] ?? 'readonly'}
                          onChange={() => {}}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button
                onClick={closeDialog}
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <X size={14} /> Annuler
              </Button>
              <Button
                onClick={() => saveRow.mutate()}
                disabled={saveRow.isPending}
                className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold flex items-center gap-2"
              >
                {saveRow.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {isAdding ? 'Ajouter la ligne' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-red-600">
              Supprimer cette ligne ?
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              Cette action est <strong>irréversible</strong>. La ligne
              {deleteTarget?.id && (
                <> avec l'ID <code className="font-mono text-[#8B0000] bg-red-50 px-1.5 py-0.5 rounded text-xs">{String(deleteTarget.id).slice(0, 8)}…</code></>
              )}{' '}
              sera définitivement supprimée de la table <strong>{currentTableInfo.label}</strong>.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteTarget(null)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => deleteTarget && deleteRow.mutate(deleteTarget)}
                disabled={deleteRow.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2"
              >
                {deleteRow.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
