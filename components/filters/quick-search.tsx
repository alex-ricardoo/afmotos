'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Tag, Bike, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MotorcycleFilterFacets } from '@/lib/queries/motorcycles';
import { cn } from '@/lib/utils';

const DEFAULT_BRANDS = [
  'Honda',
  'Yamaha',
  'BMW',
  'Kawasaki',
  'Triumph',
  'Ducati',
  'Harley-Davidson',
  'Royal Enfield',
  'Suzuki',
];

const DEFAULT_PRICE_TIERS = [
  { label: 'Até R$ 15.000', value: '15000' },
  { label: 'Até R$ 25.000', value: '25000' },
  { label: 'Até R$ 35.000', value: '35000' },
  { label: 'Até R$ 50.000', value: '50000' },
  { label: 'Até R$ 75.000', value: '75000' },
  { label: 'Até R$ 100.000', value: '100000' },
];

interface QuickSearchProps {
  facets?: MotorcycleFilterFacets;
}

export function QuickSearch({ facets }: QuickSearchProps) {
  const router = useRouter();
  const [operation, setOperation] = useState<'buy' | 'rent'>('buy');
  const [brand, setBrand] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const brands = facets?.brands?.length ? facets.brands : DEFAULT_BRANDS;
  const priceTiers = facets?.priceTiers?.length ? facets.priceTiers : DEFAULT_PRICE_TIERS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (operation === 'rent') {
      router.push('/aluguel');
      return;
    }

    const params = new URLSearchParams();
    if (brand && brand !== 'all') params.set('brand', brand);
    if (maxPrice && maxPrice !== 'all') params.set('maxPrice', maxPrice);

    router.push(`/motos?${params.toString()}`);
  };

  const selectedBrandLabel = brand && brand !== 'all' ? brand : 'Todas as marcas';
  const selectedPriceLabel =
    maxPrice && maxPrice !== 'all'
      ? priceTiers.find((p) => p.value === maxPrice)?.label ||
        `Até R$ ${Number(maxPrice).toLocaleString('pt-BR')}`
      : 'Qualquer valor';

  return (
    <form
      onSubmit={handleSearch}
      className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/80 p-4 lg:p-6 max-w-5xl mx-auto w-full transition-all duration-300"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
        {/* Coluna 1: Tipo de Operação (Pill Switcher) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Operação
          </label>
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-1 flex items-center h-[48px] gap-1">
            <button
              type="button"
              onClick={() => setOperation('buy')}
              className={cn(
                'flex-1 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
                operation === 'buy'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40',
              )}
            >
              <span>Comprar</span>
            </button>
            <Link
              href="/aluguel"
              className={cn(
                'flex-1 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
                operation === 'rent'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40',
              )}
            >
              <span>Alugar</span>
            </Link>
          </div>
        </div>

        {/* Coluna 2: Marca / Modelo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-amber-400" /> Marca / Modelo
          </label>
          <div className="bg-zinc-950/60 border border-zinc-800 focus-within:border-amber-500/50 rounded-xl px-2 transition-all h-[48px] flex items-center">
            <Select
              value={brand || 'all'}
              onValueChange={(val) => setBrand(val === 'all' ? '' : (val ?? ''))}
            >
              <SelectTrigger className="w-full h-full border-0 bg-transparent text-sm font-medium text-white focus-visible:ring-0 focus-visible:border-0 shadow-none px-2">
                <SelectValue placeholder="Todas as marcas">{selectedBrandLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Todas as marcas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coluna 3: Faixa de Preço */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 ml-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" /> Faixa de Preço
          </label>
          <div className="bg-zinc-950/60 border border-zinc-800 focus-within:border-amber-500/50 rounded-xl px-2 transition-all h-[48px] flex items-center">
            <Select
              value={maxPrice || 'all'}
              onValueChange={(val) => setMaxPrice(val === 'all' ? '' : (val ?? ''))}
            >
              <SelectTrigger className="w-full h-full border-0 bg-transparent text-sm font-medium text-white focus-visible:ring-0 focus-visible:border-0 shadow-none px-2">
                <SelectValue placeholder="Qualquer valor">{selectedPriceLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Qualquer valor</SelectItem>
                {priceTiers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coluna 4: Botão de Busca */}
        <div>
          <Button
            type="submit"
            className="w-full h-[48px] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-sm"
          >
            {operation === 'rent' ? (
              <>
                <span>Ver Opções de Aluguel</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-zinc-950" />
                <span>Buscar motos</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
