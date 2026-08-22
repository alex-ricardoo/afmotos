'use client';

import { useState } from 'react';
import { formatFipeCurrency } from '@/lib/domain/fipe-price';
import { FipeQuote } from '@/lib/fipex/types';
import { FipePriceComparison } from './fipe-price-comparison';
import { Link as LinkIcon, X, Check, Bike, Search, Loader2, AlertCircle } from 'lucide-react';

export type MotorcycleForLinker = {
  id: string;
  brand: string;
  model: string;
  year_model: number;
  price: number | null;
  mileage: number | null;
  status: string;
};

interface FipeMotorcycleLinkerProps {
  motorcycles: MotorcycleForLinker[];
  quote: FipeQuote;
  consultationId?: string | null;
  linkedMotorcycleId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLink: (motorcycleId: string) => Promise<void>;
  isLinking?: boolean;
}

export function FipeMotorcycleLinker({
  motorcycles,
  quote,
  linkedMotorcycleId,
  isOpen,
  onClose,
  onLink,
  isLinking = false,
}: FipeMotorcycleLinkerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>(linkedMotorcycleId || '');

  if (!isOpen) return null;

  const filtered = motorcycles.filter((m) => {
    const full = `${m.brand} ${m.model} ${m.year_model}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const selectedMoto = motorcycles.find((m) => m.id === selectedId);

  const handleConfirm = async () => {
    if (!selectedId) return;
    await onLink(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Vincular a Moto do Estoque</h3>
              <p className="text-xs text-muted-foreground">
                Associe esta consulta a uma moto cadastrada no AF Motos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Busca de Motos */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo ou ano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c9a44c] focus:ring-2 focus:ring-[#c9a44c]/20 outline-none transition-all"
          />
        </div>

        {/* Lista de Motos */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-secondary/10 p-6 text-center text-xs text-muted-foreground space-y-1">
              <Bike className="h-6 w-6 mx-auto opacity-40 mb-2" />
              <p className="font-semibold text-foreground">Nenhuma motocicleta encontrada</p>
              <p>Verifique o termo pesquisado ou cadastre novas motos no painel.</p>
            </div>
          ) : (
            filtered.map((moto) => {
              const isSelected = selectedId === moto.id;
              return (
                <div
                  key={moto.id}
                  onClick={() => setSelectedId(moto.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#c9a44c] bg-[#c9a44c]/10'
                      : 'border-border/60 bg-background/50 hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-[#c9a44c] text-black font-bold'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {moto.brand} {moto.model} ({moto.year_model})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {moto.mileage
                          ? `${moto.mileage.toLocaleString('pt-BR')} km`
                          : 'Km não informada'}{' '}
                        • Status: {moto.status}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[#e3c56c]">
                      {moto.price ? formatFipeCurrency(moto.price) : 'Sem preço'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Prévia do Comparativo se selecionado */}
        {selectedMoto && (
          <FipePriceComparison
            advertisedPrice={selectedMoto.price}
            fipePrice={quote.priceReais}
            motorcycleTitle={`${selectedMoto.brand} ${selectedMoto.model}`}
          />
        )}

        {/* Informação de Segurança */}
        <div className="flex items-start gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-[11px] text-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            A vinculação serve apenas como referência de margem e histórico. O preço anunciado da
            motocicleta <strong>não será alterado</strong> no site.
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId || isLinking}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a44c] hover:bg-[#b08d3b] text-black text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLinking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                <span>Vinculando...</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-3.5 w-3.5 text-black" />
                <span>Confirmar Vínculo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
