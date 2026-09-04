'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MotorcycleFilterFacets } from '@/lib/queries/motorcycles';

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
  { label: 'Até R$ 20.000', value: '20000' },
  { label: 'Até R$ 35.000', value: '35000' },
  { label: 'Até R$ 50.000', value: '50000' },
  { label: 'Até R$ 75.000', value: '75000' },
  { label: 'Até R$ 100.000', value: '100000' },
  { label: 'Acima de R$ 100.000', value: '100001' },
];

const DEFAULT_YEARS = [2026, 2025, 2024, 2023, 2022, 2020, 2018];

interface FilterFormProps {
  facets?: MotorcycleFilterFacets;
  onApply?: () => void;
}

function FilterControls({ facets, onApply }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || searchParams.get('q') || '';
  const currentPrice = searchParams.get('maxPrice') || '';
  const currentYear = searchParams.get('minYear') || '';

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const brands = facets?.brands?.length ? facets.brands : DEFAULT_BRANDS;
  const years = facets?.years?.length ? facets.years : DEFAULT_YEARS;
  const priceTiers = facets?.priceTiers?.length ? facets.priceTiers : DEFAULT_PRICE_TIERS;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/motos?${params.toString()}`);
    if (onApply) onApply();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchTerm.trim());
  };

  const clearAll = () => {
    setSearchTerm('');
    router.push('/motos');
    if (onApply) onApply();
  };

  const hasActiveFilters = !!(
    currentBrand ||
    (currentSearch && currentSearch.trim()) ||
    (currentPrice && currentPrice !== 'all') ||
    (currentYear && currentYear !== 'all')
  );

  const selectedPriceLabel =
    currentPrice && currentPrice !== 'all'
      ? priceTiers.find((p) => p.value === currentPrice)?.label ||
        `Até R$ ${Number(currentPrice).toLocaleString('pt-BR')}`
      : 'Qualquer valor';

  const selectedYearLabel =
    currentYear && currentYear !== 'all' ? `A partir de ${currentYear}` : 'Todos os anos';

  const selectedSortLabel =
    searchParams.get('sort') === 'price_asc'
      ? 'Menor Preço'
      : searchParams.get('sort') === 'price_desc'
        ? 'Maior Preço'
        : searchParams.get('sort') === 'year_desc'
          ? 'Ano Mais Recente'
          : searchParams.get('sort') === 'km_asc'
            ? 'Menor KM'
            : 'Mais recentes';

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            Limpar tudo
          </button>
        )}
      </div>

      <div className="space-y-2 md:hidden">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Ordenar por
        </Label>
        <Select
          value={searchParams.get('sort') || 'recent'}
          onValueChange={(value) => updateParam('sort', value ?? '')}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-zinc-900 border-zinc-800 text-sm text-white focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/20">
            <SelectValue>{selectedSortLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-xl">
            <SelectItem
              value="recent"
              className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            >
              Mais recentes
            </SelectItem>
            <SelectItem
              value="price_asc"
              className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            >
              Menor Preço
            </SelectItem>
            <SelectItem
              value="price_desc"
              className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            >
              Maior Preço
            </SelectItem>
            <SelectItem
              value="year_desc"
              className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            >
              Ano Mais Recente
            </SelectItem>
            <SelectItem
              value="km_asc"
              className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            >
              Menor KM
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleSearchSubmit} className="space-y-2">
        <div className="relative">
          <Input
            id="catalog-search"
            placeholder="Ex: CB 500F, MT-07..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 h-11 rounded-xl bg-zinc-900 border-zinc-800 text-sm text-white focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/20"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                updateParam('search', '');
              }}
              className="absolute right-9 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold">X</span>
            </button>
          ) : null}
          <button
            type="submit"
            aria-label="Buscar motos"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Brand Selection Chips */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Marcas
        </Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParam('brand', '')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs border transition-all cursor-pointer font-semibold',
              !currentBrand
                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white',
            )}
          >
            Todas
          </button>
          {brands.map((brand) => {
            const isSelected = currentBrand.toLowerCase() === brand.toLowerCase();
            return (
              <button
                key={brand}
                type="button"
                onClick={() => updateParam('brand', isSelected ? '' : brand)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs border transition-all cursor-pointer font-semibold',
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white',
                )}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Price Select */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Faixa de Preço
        </Label>
        <Select
          value={currentPrice || 'all'}
          onValueChange={(val) => updateParam('maxPrice', val === 'all' ? '' : (val ?? ''))}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-zinc-900 border-zinc-800 text-sm text-white focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/20">
            <SelectValue placeholder="Qualquer valor">{selectedPriceLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-xl">
            <SelectItem value="all" className="focus:bg-zinc-800 focus:text-white cursor-pointer">Qualquer valor</SelectItem>
            {priceTiers.map((tier) => (
              <SelectItem key={tier.value} value={tier.value} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Year Select */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Ano de Fabricação
        </Label>
        <Select
          value={currentYear || 'all'}
          onValueChange={(val) => updateParam('minYear', val === 'all' ? '' : (val ?? ''))}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-zinc-900 border-zinc-800 text-sm text-white focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/20">
            <SelectValue placeholder="Todos os anos">{selectedYearLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-xl">
            <SelectItem value="all" className="focus:bg-zinc-800 focus:text-white cursor-pointer">Todos os anos</SelectItem>
            {years.map((year) => (
              <SelectItem key={String(year)} value={String(year)} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                A partir de {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


    </div>
  );
}

export function MotorcycleFilters({ facets }: { facets?: MotorcycleFilterFacets }) {
  return <FilterControls facets={facets} />;
}

export function MobileFiltersDrawer({
  totalResults,
  facets,
}: {
  totalResults: number;
  facets?: MotorcycleFilterFacets;
}) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeCount = Array.from(searchParams.entries()).filter(([k]) =>
    ['brand', 'search', 'q', 'maxPrice', 'minYear'].includes(k),
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1.5 h-7 sm:h-8 px-2.5 rounded-lg border-zinc-800 hover:border-amber-500/30 font-bold text-[11px] bg-zinc-900/90 text-zinc-200 hover:text-white shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-extrabold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-6 bg-zinc-950 border-t border-zinc-800"
      >
        <SheetHeader className="pb-4 border-b border-zinc-900 text-left">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-lg font-extrabold text-white">Filtrar Motos</span>
            <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full">
              {totalResults} {totalResults === 1 ? 'moto' : 'motos'}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="py-6">
          <FilterControls facets={facets} onApply={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CatalogControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || '';
  const currentView = searchParams.get('view') || 'grid';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/motos?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
          Ordenar:
        </span>
        <Select value={currentSort} onValueChange={(val) => updateParam('sort', val ?? '')}>
          <SelectTrigger className="w-[170px] h-10 bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-white text-xs font-bold rounded-xl focus-visible:ring-amber-500 cursor-pointer">
            <SelectValue placeholder="Mais recentes" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-xl">
            <SelectItem value="recent" className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
              Mais recentes
            </SelectItem>
            <SelectItem value="price_asc" className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
              Menor Preço
            </SelectItem>
            <SelectItem value="price_desc" className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
              Maior Preço
            </SelectItem>
            <SelectItem value="year_desc" className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
              Ano Mais Recente
            </SelectItem>
            <SelectItem value="km_asc" className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
              Menor KM
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-xs">
        <button
          onClick={() => updateParam('view', 'grid')}
          className={cn(
            'p-1.5 rounded-lg transition-all cursor-pointer',
            currentView === 'grid' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-white',
          )}
          aria-label="Visualização em Grade"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
        </button>
        <button
          onClick={() => updateParam('view', 'list')}
          className={cn(
            'p-1.5 rounded-lg transition-all cursor-pointer',
            currentView === 'list' ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-400 hover:text-white',
          )}
          aria-label="Visualização em Lista"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
