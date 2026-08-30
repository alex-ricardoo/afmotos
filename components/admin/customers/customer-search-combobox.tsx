'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '@/types/customer';
import { searchCustomersForSaleAction } from '@/lib/actions/customers';
import { maskCpf, formatPhone } from '@/lib/utils/customer-normalizers';
import { CustomerSourceBadge } from './customer-source-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  UserCheck,
  X,
  Loader2,
  Check,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSearchComboboxProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenQuickCreate?: () => void;
}

export function CustomerSearchCombobox({
  selectedCustomer,
  onSelectCustomer,
  onOpenQuickCreate,
}: CustomerSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchCustomersForSaleAction(searchTerm);
        setResults(res);
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {selectedCustomer ? (
        /* Card de Cliente Selecionado */
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-[#c9a44c]/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a44c]/20 border border-[#c9a44c]/40 flex items-center justify-center text-[#e3c56c] font-bold text-xs shrink-0">
              <UserCheck className="w-4 h-4 text-[#c9a44c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">
                  {selectedCustomer.full_name}
                </span>
                <CustomerSourceBadge source={selectedCustomer.source} className="scale-90" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>{formatPhone(selectedCustomer.phone)}</span>
                {selectedCustomer.cpf && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{maskCpf(selectedCustomer.cpf)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Remover
          </Button>
        </div>
      ) : (
        /* Campo de Busca */
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Buscar cliente por nome, telefone ou CPF..."
                className="pl-9 pr-8 bg-zinc-900/80 border-zinc-800 focus:border-[#c9a44c] text-xs text-white h-9 rounded-lg"
              />
              {loading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 animate-spin" />
              )}
            </div>

            {onOpenQuickCreate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenQuickCreate}
                className="h-9 px-3 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-[#e3c56c] text-xs gap-1.5 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo</span>
              </Button>
            )}
          </div>

          {/* Dropdown de Resultados */}
          {open && (searchTerm.trim().length >= 2 || results.length > 0) && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-800/60 animate-in fade-in zoom-in-95 duration-100">
              {results.length > 0 ? (
                results.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="p-2.5 hover:bg-zinc-900/90 cursor-pointer flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-zinc-200 flex items-center gap-2">
                        <span>{c.full_name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {maskCpf(c.cpf)}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {formatPhone(c.phone)} {c.email && `• ${c.email}`}
                      </div>
                    </div>
                    <CustomerSourceBadge source={c.source} className="scale-90" />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500 space-y-2">
                  <p>Nenhum cliente encontrado para &quot;{searchTerm}&quot;.</p>
                  {onOpenQuickCreate && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onOpenQuickCreate();
                      }}
                      className="h-7 text-xs bg-[#c9a44c] text-black font-bold hover:bg-[#b5923f]"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Cadastrar &quot;{searchTerm}&quot; agora
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
