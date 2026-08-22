'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  { label: 'Até R$ 15.000', value: '15000' },
  { label: 'Até R$ 25.000', value: '25000' },
  { label: 'Até R$ 35.000', value: '35000' },
  { label: 'Até R$ 50.000', value: '50000' },
  { label: 'Até R$ 75.000', value: '75000' },
  { label: 'Até R$ 100.000', value: '100000' },
];

const DEFAULT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2018];

interface QuickSearchProps {
  facets?: MotorcycleFilterFacets;
}

export function QuickSearch({ facets }: QuickSearchProps) {
  const router = useRouter();
  const [brand, setBrand] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minYear, setMinYear] = useState<string>('');

  const brands = facets?.brands?.length ? facets.brands : DEFAULT_BRANDS;
  const years = facets?.years?.length ? facets.years : DEFAULT_YEARS;
  const priceTiers = facets?.priceTiers?.length ? facets.priceTiers : DEFAULT_PRICE_TIERS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand && brand !== 'all') params.set('brand', brand);
    if (maxPrice && maxPrice !== 'all') params.set('maxPrice', maxPrice);
    if (minYear && minYear !== 'all') params.set('minYear', minYear);

    router.push(`/motos?${params.toString()}`);
  };

  const selectedBrandLabel = brand && brand !== 'all' ? brand : 'Todas as marcas';
  const selectedPriceLabel =
    maxPrice && maxPrice !== 'all'
      ? priceTiers.find((p) => p.value === maxPrice)?.label ||
        `Até R$ ${Number(maxPrice).toLocaleString('pt-BR')}`
      : 'Qualquer valor';
  const selectedYearLabel =
    minYear && minYear !== 'all' ? `A partir de ${minYear}` : 'Todos os anos';

  return (
    <form
      onSubmit={handleSearch}
      className="w-full bg-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#c9a44c]/30 transition-all duration-300"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
        {/* Brand Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#b8bcc2] ml-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#e3c56c]" /> Marca
          </label>
          <Select
            value={brand || 'all'}
            onValueChange={(val) => setBrand(val === 'all' ? '' : (val ?? ''))}
          >
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Todas as marcas">{selectedBrandLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Price Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#b8bcc2] ml-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#e3c56c]" /> Preço máximo
          </label>
          <Select
            value={maxPrice || 'all'}
            onValueChange={(val) => setMaxPrice(val === 'all' ? '' : (val ?? ''))}
          >
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Qualquer valor">{selectedPriceLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Qualquer valor</SelectItem>
              {priceTiers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#b8bcc2] ml-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#e3c56c]" /> Ano mínimo
          </label>
          <Select
            value={minYear || 'all'}
            onValueChange={(val) => setMinYear(val === 'all' ? '' : (val ?? ''))}
          >
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Todos os anos">{selectedYearLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Todos os anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={String(y)} value={String(y)}>
                  A partir de {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit CTA */}
        <div className="pt-2 sm:pt-5 lg:pt-5">
          <Button
            type="submit"
            className="w-full h-11 bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold rounded-xl shadow-[0_0_15px_rgba(201,164,76,0.3)] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#050505]" />
            <span>Buscar motos</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
