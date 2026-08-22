'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowRight, Tag, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const BRANDS = [
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

const PRICE_RANGES = [
  { label: 'Até R$ 20.000', value: '20000' },
  { label: 'Até R$ 35.000', value: '35000' },
  { label: 'Até R$ 50.000', value: '50000' },
  { label: 'Até R$ 80.000', value: '80000' },
  { label: 'Até R$ 120.000', value: '120000' },
];

const YEARS = ['2018', '2020', '2022', '2023', '2024', '2025', '2026'];

export function QuickSearch() {
  const router = useRouter();
  const [brand, setBrand] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minYear, setMinYear] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand && brand !== 'all') params.set('brand', brand);
    if (maxPrice && maxPrice !== 'all') params.set('maxPrice', maxPrice);
    if (minYear && minYear !== 'all') params.set('minYear', minYear);
    if (keyword.trim()) params.set('search', keyword.trim());

    router.push(`/motos?${params.toString()}`);
  };

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
          <Select value={brand} onValueChange={(val) => setBrand(val ?? '')}>
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Todas as Marcas" />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Todas as Marcas</SelectItem>
              {BRANDS.map((b) => (
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
            <DollarSign className="w-3.5 h-3.5 text-[#e3c56c]" /> Preço Máximo
          </label>
          <Select value={maxPrice} onValueChange={(val) => setMaxPrice(val ?? '')}>
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Qualquer Valor" />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Qualquer Valor</SelectItem>
              {PRICE_RANGES.map((p) => (
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
            <Calendar className="w-3.5 h-3.5 text-[#e3c56c]" /> Ano Mínimo
          </label>
          <Select value={minYear} onValueChange={(val) => setMinYear(val ?? '')}>
            <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
              <SelectValue placeholder="Qualquer Ano" />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
              <SelectItem value="all">Qualquer Ano</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
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
            <span>Buscar Motos</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
