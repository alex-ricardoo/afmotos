'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Bike, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { MotorcycleCardData } from './motorcycle-card';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface SoldMotorcyclesClientProps {
  motorcycles: MotorcycleCardData[];
  whatsappPhone?: string;
  siteName?: string;
}

export function SoldMotorcyclesClient({
  motorcycles,
  whatsappPhone,
  siteName,
}: SoldMotorcyclesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Extract available brands with counts
  const brandFacets = useMemo(() => {
    const map = new Map<string, number>();
    motorcycles.forEach((moto) => {
      const b = moto.brand?.trim();
      if (b) {
        map.set(b, (map.get(b) || 0) + 1);
      }
    });

    const list = Array.from(map.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    return list;
  }, [motorcycles]);

  // Filtered list based on search and selected brand
  const filteredMotorcycles = useMemo(() => {
    return motorcycles.filter((moto) => {
      // Brand filter
      if (selectedBrand !== 'ALL' && moto.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const brandMatch = moto.brand?.toLowerCase().includes(query);
        const modelMatch = moto.model?.toLowerCase().includes(query);
        const versionMatch = moto.version?.toLowerCase().includes(query);
        const yearMatch = `${moto.year_manufacture}/${moto.year_model}`.includes(query);

        if (!brandMatch && !modelMatch && !versionMatch && !yearMatch) {
          return false;
        }
      }

      return true;
    });
  }, [motorcycles, selectedBrand, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedBrand !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
  };

  return (
    <div className="space-y-8">
      {/* Controls Bar: Search & Quick Brand Pills */}
      <div className="bg-zinc-900/60 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-zinc-800/80 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modelo, marca ou ano..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action to View Available Inventory */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <Link
              href="/motos"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'rounded-xl font-bold text-xs h-11 px-4 bg-zinc-950 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500 transition-all shadow-xs cursor-pointer',
              )}
            >
              <span>Ver Estoque Disponível</span>
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Brand Filter Pills */}
        {brandFacets.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 shrink-0 mr-1">
              Marcas:
            </span>

            <button
              type="button"
              onClick={() => setSelectedBrand('ALL')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                selectedBrand === 'ALL'
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white',
              )}
            >
              Todas ({motorcycles.length})
            </button>

            {brandFacets.map(({ brand, count }) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer',
                  selectedBrand.toLowerCase() === brand.toLowerCase()
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white',
                )}
              >
                {brand} ({count})
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs text-amber-400/80 hover:text-amber-300 hover:underline shrink-0 font-semibold px-2 cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Header Status */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
            Motos Entregues
          </h2>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {filteredMotorcycles.length}{' '}
            {filteredMotorcycles.length === 1 ? 'modelo' : 'modelos'}
          </span>
        </div>

        {hasActiveFilters && (
          <span className="text-xs text-zinc-400 hidden sm:inline-block">
            Filtrando {filteredMotorcycles.length} de {motorcycles.length} motos
          </span>
        )}
      </div>

      {/* Grid of Sold Motorcycles */}
      <MotorcycleGrid
        motorcycles={filteredMotorcycles}
        emptyMessage={
          hasActiveFilters
            ? 'Nenhuma moto vendida encontrada para os filtros aplicados. Tente buscar outro termo ou limpar a seleção.'
            : 'O histórico de motos vendidas está sendo atualizado.'
        }
        whatsappPhone={whatsappPhone}
        siteName={siteName}
      />
    </div>
  );
}
