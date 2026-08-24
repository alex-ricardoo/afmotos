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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <LinkIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Vincular a Moto do Estoque</h3>
              <p className="text-xs text-slate-400">
                Associe esta cotação FIPE ao cadastro de uma moto no estoque
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Busca de Motos */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo ou ano no estoque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        {/* Lista de Motos */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400 space-y-1">
              <Bike className="h-6 w-6 mx-auto opacity-40 mb-2 text-slate-500" />
              <p className="font-semibold text-white">Nenhuma motocicleta encontrada</p>
              <p>Verifique o termo pesquisado ou cadastre novas motos no estoque.</p>
            </div>
          ) : (
            filtered.map((moto) => {
              const isSelected = selectedId === moto.id;
              return (
                <div
                  key={moto.id}
                  onClick={() => setSelectedId(moto.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {moto.brand} {moto.model} ({moto.year_model})
                      </p>
                      <p className="text-xs text-slate-400">
                        {moto.mileage
                          ? `${moto.mileage.toLocaleString('pt-BR')} km`
                          : 'Km não informada'}{' '}
                        • Status: <strong className="text-slate-300">{moto.status}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-400 font-mono">
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
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3.5 text-xs text-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            A vinculação serve apenas como referência de margem e histórico. O preço anunciado da
            motocicleta <strong>não será alterado</strong> no site público.
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId || isLinking}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLinking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                <span>Vinculando...</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-3.5 w-3.5 text-slate-950" />
                <span>Confirmar Vínculo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
