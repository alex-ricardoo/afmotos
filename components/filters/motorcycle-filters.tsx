'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RotateCcw, Filter, Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
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

const POPULAR_BRANDS = [
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

const PRICE_TIERS = [
  { label: 'Todos os preços', value: 'all' },
  { label: 'Até R$ 25.000', value: '25000' },
  { label: 'Até R$ 40.000', value: '40000' },
  { label: 'Até R$ 60.000', value: '60000' },
  { label: 'Até R$ 90.000', value: '90000' },
  { label: 'Acima de R$ 90.000', value: '90001' },
];

const YEARS = [
  { label: 'Todos os anos', value: 'all' },
  { label: '2025+', value: '2025' },
  { label: '2024+', value: '2024' },
  { label: '2022+', value: '2022' },
  { label: '2020+', value: '2020' },
  { label: '2018+', value: '2018' },
];

interface FilterFormProps {
  onApply?: () => void;
}

function FilterControls({ onApply }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || searchParams.get('q') || '';
  const currentPrice = searchParams.get('maxPrice') || 'all';
  const currentYear = searchParams.get('minYear') || 'all';

  const [searchTerm, setSearchTerm] = useState(currentSearch);

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

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="space-y-2">
        <Label
          htmlFor="catalog-search"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          Buscar Modelo ou Versão
        </Label>
        <div className="relative">
          <Input
            id="catalog-search"
            placeholder="Ex: CB 500F, MT-07..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 h-10 rounded-xl bg-background border-border text-sm"
          />
          <button
            type="submit"
            aria-label="Buscar motos"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#a6a6a1] hover:text-[#e3c56c] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Brand Selection Chips */}
      <div className="space-y-2.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-[#b8bcc2]">
          Marcas em Destaque
        </Label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => updateParam('brand', '')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
              !currentBrand
                ? 'bg-[#c9a44c] text-[#050505] border-[#c9a44c] font-bold shadow-xs'
                : 'bg-[#151515] text-[#a6a6a1] border-[#c9a44c]/20 hover:border-[#c9a44c]/60 hover:text-white',
            )}
          >
            Todas
          </button>
          {POPULAR_BRANDS.map((brand) => {
            const isSelected = currentBrand.toLowerCase() === brand.toLowerCase();
            return (
              <button
                key={brand}
                type="button"
                onClick={() => updateParam('brand', isSelected ? '' : brand)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-[#c9a44c] text-[#050505] border-[#c9a44c] font-bold shadow-xs'
                    : 'bg-[#151515] text-[#a6a6a1] border-[#c9a44c]/20 hover:border-[#c9a44c]/60 hover:text-white',
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
        <Label className="text-xs font-bold uppercase tracking-wider text-[#b8bcc2]">
          Faixa de Preço
        </Label>
        <Select value={currentPrice} onValueChange={(val) => updateParam('maxPrice', val ?? 'all')}>
          <SelectTrigger className="w-full h-10 rounded-xl bg-[#151515] border-[#c9a44c]/20 text-sm text-white">
            <SelectValue placeholder="Selecione o valor" />
          </SelectTrigger>
          <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
            {PRICE_TIERS.map((tier) => (
              <SelectItem key={tier.value} value={tier.value}>
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Year Select */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-[#b8bcc2]">
          Ano Mínimo de Fabricação
        </Label>
        <Select value={currentYear} onValueChange={(val) => updateParam('minYear', val ?? 'all')}>
          <SelectTrigger className="w-full h-10 rounded-xl bg-[#151515] border-[#c9a44c]/20 text-sm text-white">
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
            {YEARS.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Action */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearAll}
          className="w-full h-10 rounded-xl border-dashed border-[#c9a44c]/40 text-xs font-bold text-[#e3c56c] hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Todos os Filtros</span>
        </Button>
      )}
    </div>
  );
}

export function MotorcycleFilters() {
  return <FilterControls />;
}

export function MobileFiltersDrawer({ totalResults }: { totalResults: number }) {
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
            className="md:hidden flex items-center gap-2 h-11 px-4 rounded-xl border-[#c9a44c]/30 font-bold text-sm bg-[#151515] text-white shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#e3c56c]" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#c9a44c] text-black text-[11px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 bg-[#0d0d0d] border-t border-[#c9a44c]/30"
      >
        <SheetHeader className="pb-4 border-b border-[#c9a44c]/20 text-left">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">Filtrar Estoque</span>
            <span className="text-xs text-[#a6a6a1] font-medium">
              {totalResults} {totalResults === 1 ? 'moto' : 'motos'}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="py-6">
          <FilterControls onApply={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
