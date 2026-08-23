'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Check, ChevronsUpDown, X, Search } from 'lucide-react';
import {
  PERNAMBUCO_CITIES,
  normalizeSearchTerm,
  getCanonicalPernambucoCity,
} from '@/lib/constants/pernambuco-cities';
import { cn } from '@/lib/utils';

interface PECityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
}

export function PECityCombobox({
  value,
  onChange,
  error,
  disabled,
  id = 'pe-city-combobox',
  'aria-describedby': ariaDescribedBy,
}: PECityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const normalizedSearch = normalizeSearchTerm(searchTerm);

  const filteredCities = PERNAMBUCO_CITIES.filter((city) =>
    normalizeSearchTerm(city).includes(normalizedSearch),
  );

  const handleSelect = (cityName: string) => {
    const canonical = getCanonicalPernambucoCity(cityName) || cityName;
    onChange(canonical);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

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
            setTimeout(() => inputRef.current?.focus(), 50);
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
          <MapPin className="w-4 h-4 text-[#c9a44c] shrink-0" />
          <span className={cn('truncate', !value && 'text-[#a6a6a1]')}>
            {value || 'Selecione uma cidade de PE...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
              aria-label="Limpar cidade selecionada"
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
          <div className="p-2 border-b border-[#252525] bg-[#0a0a0a]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[#a6a6a1]" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar município de PE..."
                className="w-full bg-[#181818] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#666] focus:outline-none focus:border-[#e3c56c]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filteredCities.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredCities[0]);
                  }
                }}
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {filteredCities.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#a6a6a1]">
                Nenhum município encontrado em Pernambuco.
              </div>
            ) : (
              filteredCities.map((cityName) => {
                const isSelected = normalizeSearchTerm(value) === normalizeSearchTerm(cityName);
                return (
                  <button
                    key={cityName}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cityName)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#c9a44c]/20 text-[#e3c56c] font-bold'
                        : 'text-[#e0e0e0] hover:bg-[#1f1f1f] hover:text-white',
                    )}
                  >
                    <span>{cityName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#e3c56c]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
