'use client';

import { useState } from 'react';
import { FipeConsultationWithMotorcycle } from '@/lib/queries/fipe-consultations';
import { formatFipeCurrency, formatModelYear } from '@/lib/domain/fipe-price';
import {
  History,
  RotateCcw,
  Trash2,
  Edit3,
  Check,
  X,
  ExternalLink,
  Bike,
  Calendar,
  Fuel,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FipeHistorySectionProps {
  consultations: FipeConsultationWithMotorcycle[];
  onOpenConsultation: (consultation: FipeConsultationWithMotorcycle) => void;
  onRequery: (consultation: FipeConsultationWithMotorcycle) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  isDeletingId?: string | null;
}

export function FipeHistorySection({
  consultations,
  onOpenConsultation,
  onRequery,
  onDelete,
  onUpdateNotes,
  isDeletingId,
}: FipeHistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const filtered = consultations.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.brand_name.toLowerCase().includes(term) ||
      c.model_name.toLowerCase().includes(term) ||
      (c.fipe_code && c.fipe_code.toLowerCase().includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term)) ||
      (c.motorcycles &&
        `${c.motorcycles.brand} ${c.motorcycles.model}`.toLowerCase().includes(term))
    );
  });

  const handleStartEditNotes = (c: FipeConsultationWithMotorcycle) => {
    setEditingNotesId(c.id);
    setNotesText(c.notes || '');
  };

  const handleSaveNotes = async (id: string) => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(id, notesText);
      setEditingNotesId(null);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/20">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Histórico de Consultas Salvas</h3>
            <p className="text-xs text-zinc-400">
              {consultations.length}{' '}
              {consultations.length === 1 ? 'consulta registrada' : 'consultas registradas'}
            </p>
          </div>
        </div>

        {/* Busca no histórico */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Filtrar histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-[#c9a44c] outline-none transition-all"
          />
        </div>
      </div>

      {/* Lista Vazia */}
      {consultations.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
          <History className="h-10 w-10 mx-auto opacity-30 text-zinc-500" />
          <p className="text-sm font-bold text-white">
            Nenhuma consulta salva até o momento
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Ao realizar uma consulta no formulário, clique em &ldquo;Salvar Consulta&rdquo;
            para registrar uma referência histórica e vincular ao estoque.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-xs text-zinc-400">
          Nenhuma consulta corresponde ao filtro &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <>
          {/* Visualização Desktop (Tabela) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold font-mono">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Motocicleta</th>
                  <th className="py-3 px-3">Ano / Combustível</th>
                  <th className="py-3 px-3">Valor FIPE</th>
                  <th className="py-3 px-3">Moto Vinculada</th>
                  <th className="py-3 px-3">Notas Internas</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {filtered.map((item) => {
                  const isEditingThis = editingNotesId === item.id;
                  const isDeleting = isDeletingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors group">
                      {/* Data */}
                      <td className="py-3.5 px-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </td>

                      {/* Motocicleta */}
                      <td className="py-3.5 px-3 font-semibold text-white">
                        <div>
                          <span>
                            {item.brand_name} {item.model_name}
                          </span>
                          {item.fipe_code && (
                            <span className="block text-[10px] font-mono text-zinc-500">
                              {item.fipe_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ano / Combustível */}
                      <td className="py-3.5 px-3 text-zinc-300">
                        <span>{formatModelYear(item.model_year, item.is_zero_km)}</span>
                        {item.fuel_name && (
                          <span className="text-[11px] block text-zinc-500">{item.fuel_name}</span>
                        )}
                      </td>

                      {/* Valor FIPE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-[#e3c56c] font-mono">
                          {formatFipeCurrency(item.fipe_price)}
                        </span>
                        {item.reference_label && (
                          <span className="block text-[10px] text-zinc-500">
                            {item.reference_label}
                          </span>
                        )}
                      </td>

                      {/* Moto Vinculada */}
                      <td className="py-3.5 px-3">
                        {item.motorcycles ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#c9a44c]/10 text-[#e3c56c] border border-[#c9a44c]/20 text-[11px] font-medium">
                            <Bike className="h-3.5 w-3.5 shrink-0 text-[#c9a44c]" />
                            <span className="truncate max-w-[120px]">
                              {item.motorcycles.brand} {item.motorcycles.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">Sem vínculo</span>
                        )}
                      </td>

                      {/* Notas */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-white outline-none focus:border-[#c9a44c]"
                              placeholder="Adicionar nota..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNotes(item.id)}
                              disabled={isSavingNotes}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditNotes(item)}
                            className="cursor-pointer group/note flex items-center justify-between text-zinc-400 hover:text-white"
                          >
                            <span className="truncate block">
                              {item.notes || (
                                <span className="opacity-40 italic">Adicionar nota...</span>
                              )}
                            </span>
                            <Edit3 className="h-3 w-3 opacity-0 group-hover/note:opacity-100 transition-opacity text-[#c9a44c] ml-1 shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onOpenConsultation(item)}
                            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
                            title="Abrir no card principal"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-[#c9a44c]" />
                          </button>
                          <button
                            onClick={() => onRequery(item)}
                            className="p-2 rounded-lg text-[#e3c56c] hover:bg-amber-500/15 transition-colors cursor-pointer border border-transparent hover:border-amber-500/30"
                            title="Consultar novamente"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-rose-500/30"
                            title="Excluir consulta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visualização Mobile & Tablet (Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                    <h4 className="font-bold text-sm text-white">
                      {item.brand_name} {item.model_name}
                    </h4>
                  </div>
                  <span className="text-base font-extrabold text-[#e3c56c] font-mono">
                    {formatFipeCurrency(item.fipe_price)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#c9a44c]" />
                    <span>{formatModelYear(item.model_year, item.is_zero_km)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-[#c9a44c]" />
                    <span className="truncate">{item.fuel_name || 'Gasolina'}</span>
                  </div>
                </div>

                {item.motorcycles && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-xs text-[#e3c56c] mt-2">
                    <Bike className="h-3.5 w-3.5 shrink-0 text-[#c9a44c]" />
                    <span className="truncate">
                      Vinculada: {item.motorcycles.brand} {item.motorcycles.model}
                    </span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-zinc-300 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 mt-2">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}

                <div className="grid grid-cols-12 gap-2 pt-3 mt-3 border-t border-zinc-800">
                  <button
                    onClick={() => onRequery(item)}
                    className="col-span-8 sm:col-span-9 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30 text-xs font-bold hover:bg-[#c9a44c]/25 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Re-consultar</span>
                  </button>
                  <button
                    onClick={() => onOpenConsultation(item)}
                    className="col-span-2 min-h-[44px] inline-flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4 text-[#c9a44c]" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="col-span-2 min-h-[44px] inline-flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer border border-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
