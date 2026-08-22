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
  Hash,
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
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Histórico de Consultas Salvas</h3>
            <p className="text-xs text-muted-foreground">
              {consultations.length}{' '}
              {consultations.length === 1 ? 'consulta registrada' : 'consultas registradas'}
            </p>
          </div>
        </div>

        {/* Busca no histórico */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Lista Vazia */}
      {consultations.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-secondary/10 p-8 text-center space-y-2">
          <History className="h-8 w-8 mx-auto opacity-30 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            Nenhuma consulta salva até o momento
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Ao realizar uma consulta no formulário acima, clique em &ldquo;Salvar Consulta&rdquo;
            para registrar uma referência histórica.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-secondary/10 p-6 text-center text-xs text-muted-foreground">
          Nenhuma consulta corresponde ao filtro digitado.
        </div>
      ) : (
        <>
          {/* Visualização Desktop (Tabela) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Motocicleta</th>
                  <th className="py-3 px-3">Ano / Combustível</th>
                  <th className="py-3 px-3">Valor FIPE</th>
                  <th className="py-3 px-3">Moto Vinculada</th>
                  <th className="py-3 px-3">Notas Internas</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((item) => {
                  const isEditingThis = editingNotesId === item.id;
                  const isDeleting = isDeletingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors group">
                      {/* Data */}
                      <td className="py-3.5 px-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </td>

                      {/* Motocicleta */}
                      <td className="py-3.5 px-3 font-semibold text-foreground">
                        <div>
                          <span>
                            {item.brand_name} {item.model_name}
                          </span>
                          {item.fipe_code && (
                            <span className="block text-[10px] font-mono text-muted-foreground">
                              {item.fipe_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ano / Combustível */}
                      <td className="py-3.5 px-3 text-muted-foreground">
                        <span>{formatModelYear(item.model_year, item.is_zero_km)}</span>
                        {item.fuel_name && (
                          <span className="text-[11px] block opacity-75">{item.fuel_name}</span>
                        )}
                      </td>

                      {/* Valor FIPE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-amber-500">
                          {formatFipeCurrency(item.fipe_price)}
                        </span>
                        {item.reference_label && (
                          <span className="block text-[10px] text-muted-foreground">
                            {item.reference_label}
                          </span>
                        )}
                      </td>

                      {/* Moto Vinculada */}
                      <td className="py-3.5 px-3">
                        {item.motorcycles ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-medium">
                            <Bike className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {item.motorcycles.brand} {item.motorcycles.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">Sem vínculo</span>
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
                              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-amber-500"
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
                            className="cursor-pointer group/note flex items-center justify-between text-muted-foreground hover:text-foreground"
                          >
                            <span className="truncate block">
                              {item.notes || (
                                <span className="opacity-40 italic">Adicionar nota...</span>
                              )}
                            </span>
                            <Edit3 className="h-3 w-3 opacity-0 group-hover/note:opacity-100 transition-opacity text-amber-500 ml-1 shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onOpenConsultation(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                            title="Abrir no card principal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onRequery(item)}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/15 transition-colors cursor-pointer"
                            title="Consultar novamente"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer disabled:opacity-50"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-secondary/20 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">
                      {item.brand_name} {item.model_name}
                    </h4>
                  </div>
                  <span className="text-base font-extrabold text-amber-500">
                    {formatFipeCurrency(item.fipe_price)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    <span>{formatModelYear(item.model_year, item.is_zero_km)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-amber-500" />
                    <span className="truncate">{item.fuel_name || 'Gasolina'}</span>
                  </div>
                </div>

                {item.motorcycles && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 mt-2">
                    <Bike className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Vinculada: {item.motorcycles.brand} {item.motorcycles.model}
                    </span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-muted-foreground italic bg-background/50 p-2 rounded-lg mt-2">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}

                <div className="grid grid-cols-12 gap-2 pt-3 mt-3 border-t border-border/40">
                  <button
                    onClick={() => onRequery(item)}
                    className="col-span-8 sm:col-span-9 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Re-consultar</span>
                  </button>
                  <button
                    onClick={() => onOpenConsultation(item)}
                    className="col-span-2 min-h-[48px] inline-flex items-center justify-center rounded-xl border border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="col-span-2 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
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
