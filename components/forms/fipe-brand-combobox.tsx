'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tag, Check, ChevronsUpDown, X, Search, Loader2, Edit3 } from 'lucide-react';
import {
  FipeBrand,
  RawApiResponse,
  RawMake,
  RawPreludeData,
  FipeVehicleType,
} from '@/lib/fipex/types';
import { fipexFetch } from '@/lib/fipex/client';
import { mapBrand, mapPrelude } from '@/lib/fipex/mappers';
import { fipexCache, FIPEX_CACHE_TTL } from '@/lib/fipex/cache';
import { cn } from '@/lib/utils';

const POPULAR_BRANDS = new Set([
  'HONDA',
  'YAMAHA',
  'SHINERAY',
  'BMW',
  'KAWASAKI',
  'SUZUKI',
  'ROYAL ENFIELD',
  'BAJAJ',
  'AVELLOZ',
  'VOLTZ',
  'MOTTU',
  'TRIUMPH',
  'DUCATI',
  'HARLEY-DAVIDSON',
  'DAFRA',
]);

interface FipeBrandComboboxProps {
  value: string;
  brandId?: string | null;
  onSelect: (brandName: string, brandId?: string | null) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
}

export function FipeBrandCombobox({
  value,
  onSelect,
  error,
  disabled,
  id = 'fipe-brand-combobox',
  'aria-describedby': ariaDescribedBy,
}: FipeBrandComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyPopular, setOnlyPopular] = useState(true);
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carregar marcas de moto da fipeX com resolução dinâmica de type_id do prelude
  useEffect(() => {
    let isMounted = true;

    async function loadBrands() {
      setLoading(true);
      setApiFailed(false);

      try {
        // 1. Obter type_id real para motocicletas
        let motoTypeId = '';
        const cachedPrelude = fipexCache.get<{ vehicleTypes: FipeVehicleType[] }>('prelude');
        if (cachedPrelude) {
          const motoType = cachedPrelude.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
          );
          motoTypeId = motoType ? motoType.id : cachedPrelude.vehicleTypes[0]?.id || '';
        }

        if (!motoTypeId) {
          const rawPrelude = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
          const mappedPrelude = mapPrelude(rawPrelude.data);
          fipexCache.set('prelude', mappedPrelude, FIPEX_CACHE_TTL.PRELUDE);
          const motoType = mappedPrelude.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
          );
          motoTypeId = motoType ? motoType.id : mappedPrelude.vehicleTypes[0]?.id || '';
        }

        if (!motoTypeId) {
          if (isMounted) setApiFailed(true);
          return;
        }

        const cacheKey = `makes_all:${motoTypeId}`;
        const cached = fipexCache.get<FipeBrand[]>(cacheKey);
        if (cached && cached.length > 0) {
          if (isMounted) {
            setBrands(cached);
            setLoading(false);
          }
          return;
        }

        // 2. Buscar lista de marcas com o type_id real
        const raw = await fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', {
          type_id: motoTypeId,
          limit: 50,
          page: 1,
          order_by: 'name',
        });

        let combined = (raw.data || []).map(mapBrand);
        const totalPages = raw.pagination?.pages || 1;

        if (totalPages > 1) {
          const remaining = [];
          for (let p = 2; p <= Math.min(totalPages, 5); p++) {
            remaining.push(
              fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', {
                type_id: motoTypeId,
                limit: 50,
                page: p,
                order_by: 'name',
              }),
            );
          }
          const results = await Promise.allSettled(remaining);
          results.forEach((res) => {
            if (res.status === 'fulfilled' && res.value.data) {
              combined = combined.concat(res.value.data.map(mapBrand));
            }
          });
        }

        const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());
        if (unique.length > 0) {
          fipexCache.set(cacheKey, unique, FIPEX_CACHE_TTL.BRANDS);
          if (isMounted) {
            setBrands(unique);
          }
        } else if (isMounted) {
          setApiFailed(true);
        }
      } catch (err) {
        console.warn('Erro ao carregar marcas da fipeX:', err);
        if (isMounted) {
          setApiFailed(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPopular = (name: string) => POPULAR_BRANDS.has(name.trim().toUpperCase());

  const filteredBrands = brands.filter((b) => {
    const matches = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matches) return false;
    if (onlyPopular && !searchTerm) {
      return isPopular(b.name);
    }
    return true;
  });

  const handleSelectBrand = (brand: FipeBrand) => {
    onSelect(brand.name, brand.id);
    setSearchTerm('');
    setIsOpen(false);
    setManualMode(false);
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onSelect('', null);
    setSearchTerm('');
  };

  if (manualMode) {
    return (
      <div className="space-y-1.5 w-full">
        <div className="relative">
          <input
            id={id}
            type="text"
            value={value}
            disabled={disabled}
            aria-describedby={ariaDescribedBy}
            onChange={(e) => onSelect(e.target.value, null)}
            placeholder="Digite o nome da marca..."
            className={cn(
              'w-full h-11 px-3.5 rounded-xl bg-[#0d0d0d] border text-white text-sm transition-all focus:outline-none',
              error
                ? 'border-rose-500/70 text-rose-300'
                : 'border-[#c9a44c]/20 hover:border-[#c9a44c]/40 focus:border-[#e3c56c]',
            )}
          />
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="absolute right-2.5 top-2.5 text-xs text-[#c9a44c] hover:text-[#e3c56c] underline"
          >
            Usar lista FIPE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3.5 h-11 rounded-xl bg-[#0d0d0d] border text-left text-sm transition-all outline-none',
          'focus-visible:ring-2 focus-visible:ring-[#e3c56c]/40 focus-visible:border-[#e3c56c]',
          error
            ? 'border-rose-500/70 text-rose-300'
            : 'border-[#c9a44c]/20 hover:border-[#c9a44c]/40 text-white',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Tag className="w-4 h-4 text-[#c9a44c] shrink-0" />
          <span className={cn('truncate', !value && 'text-[#a6a6a1]')}>
            {value || 'Selecione a marca da moto...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {loading && <Loader2 className="w-4 h-4 text-[#c9a44c] animate-spin" />}
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e);
                }
              }}
              className="p-1 rounded-md text-[#a6a6a1] hover:text-white hover:bg-[#202020] transition-colors"
              aria-label="Limpar marca selecionada"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-[#a6a6a1]" />
        </div>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-xl bg-[#121212] border border-[#c9a44c]/30 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="p-2 border-b border-[#252525] bg-[#0a0a0a] space-y-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[#a6a6a1]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar marca (Ex: Honda, Yamaha)..."
                className="w-full bg-[#181818] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#666] focus:outline-none focus:border-[#e3c56c]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filteredBrands.length > 0) {
                    e.preventDefault();
                    handleSelectBrand(filteredBrands[0]);
                  }
                }}
              />
            </div>

            {!searchTerm && brands.length > 0 && (
              <div className="flex items-center justify-between px-1 text-[11px] text-[#888]">
                <span>{onlyPopular ? 'Marcas Mais Comuns' : 'Todas as Marcas'}</span>
                <button
                  type="button"
                  onClick={() => setOnlyPopular((p) => !p)}
                  className="text-[#c9a44c] hover:underline"
                >
                  {onlyPopular ? 'Ver todas' : 'Ver principais'}
                </button>
              </div>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-[#a6a6a1]">
                <Loader2 className="w-4 h-4 text-[#c9a44c] animate-spin" />
                <span>Carregando marcas da tabela FIPE...</span>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="py-4 px-3 text-center space-y-2">
                <p className="text-xs text-[#a6a6a1]">
                  {apiFailed
                    ? 'Catálogo FIPE temporariamente indisponível.'
                    : 'Nenhuma marca encontrada com esse nome.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(true);
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-xs text-[#e3c56c] font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Digitar marca manualmente
                </button>
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const isSelected = value.trim().toUpperCase() === brand.name.trim().toUpperCase();
                return (
                  <button
                    key={brand.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectBrand(brand)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#c9a44c]/20 text-[#e3c56c] font-bold'
                        : 'text-[#e0e0e0] hover:bg-[#1f1f1f] hover:text-white',
                    )}
                  >
                    <span>{brand.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#e3c56c]" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-[#202020] bg-[#0a0a0a] flex items-center justify-between text-[11px] text-[#777]">
            <span>Não encontrou a marca?</span>
            <button
              type="button"
              onClick={() => {
                setManualMode(true);
                setIsOpen(false);
              }}
              className="text-[#c9a44c] hover:underline"
            >
              Digitar manualmente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
