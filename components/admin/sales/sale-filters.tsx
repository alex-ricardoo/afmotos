'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentMethodLabels: Record<string, string> = {
  ALL: 'Todas as Formas',
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência / TED',
  CARTAO: 'Cartão Crédito/Débito',
  FINANCIAMENTO: 'Financiamento',
  OUTRO: 'Outro',
};

const monthNamesBR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function SaleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentMonth = searchParams.get('month') || 'ALL';
  const currentPayment = searchParams.get('payment') || 'ALL';

  const monthOptions = useMemo(() => {
    const options = [{ value: 'ALL', label: 'Todos os Meses' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${monthNamesBR[d.getMonth()]} de ${y}`;
      options.push({ value: `${y}-${m}`, label });
    }
    return options;
  }, []);

  const currentMonthLabel = useMemo(() => {
    if (currentMonth === 'ALL') return 'Todos os Meses';
    const found = monthOptions.find((opt) => opt.value === currentMonth);
    return found ? found.label : 'Todos os Meses';
  }, [currentMonth, monthOptions]);

  const updateQueryParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.replace(pathname);
  };

  const hasActiveFilters = Boolean(
    currentSearch ||
    (currentMonth && currentMonth !== 'ALL') ||
    (currentPayment && currentPayment !== 'ALL'),
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Campo de busca textual */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={currentSearch}
            onChange={(e) => updateQueryParams('search', e.target.value)}
            placeholder="Buscar por comprador, moto, placa, CPF ou recibo..."
            className="pl-9.5 pr-8 h-11 bg-background rounded-xl text-xs sm:text-sm"
          />
          {currentSearch && (
            <button
              onClick={() => updateQueryParams('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Seletor Amigável de Mês / Período */}
        <div className="sm:col-span-3">
          <Select
            value={currentMonth}
            onValueChange={(val: string | null) => updateQueryParams('month', val || 'ALL')}
          >
            <SelectTrigger className="h-11 bg-background rounded-xl text-xs sm:text-sm">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Mês">{currentMonthLabel}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-64">
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Forma de Pagamento */}
        <div className="sm:col-span-3">
          <Select
            value={currentPayment}
            onValueChange={(val: string | null) => updateQueryParams('payment', val || 'ALL')}
          >
            <SelectTrigger className="h-11 bg-background rounded-xl text-xs sm:text-sm">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Pagamento">
                  {paymentMethodLabels[currentPayment] || 'Todas as Formas'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50">
          <span>Filtros ativos aplicados à listagem</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-amber-500 hover:text-amber-400 p-0 hover:bg-transparent cursor-pointer"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
