'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Tag,
  Calendar,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { sourceConfig } from './customer-source-badge';
import { CustomerSource } from '@/types/customer';

const statusLabels: Record<string, string> = {
  active: 'Apenas Ativos',
  inactive: 'Apenas Inativos',
  all: 'Todos os Status',
};

const genderLabels: Record<string, string> = {
  all: 'Todos os Sexos',
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not_to_say: 'Não informado',
};

const dateRangeLabels: Record<string, string> = {
  all: 'Qualquer data',
  today: 'Cadastrados hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Neste mês',
};

export function CustomerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get('q') || '';
  const currentSource = searchParams.get('source') || 'all';
  const currentGender = searchParams.get('gender') || 'all';
  const currentStatus = searchParams.get('status') || 'active';
  const currentDateRange = searchParams.get('date_range') || 'all';

  const [searchTerm, setSearchTerm] = useState(currentQ);
  const [source, setSource] = useState(currentSource);
  const [gender, setGender] = useState(currentGender);
  const [status, setStatus] = useState(currentStatus);
  const [dateRange, setDateRange] = useState(currentDateRange);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync state when URL changes
  useEffect(() => {
    setSearchTerm(currentQ);
    setSource(currentSource);
    setGender(currentGender);
    setStatus(currentStatus);
    setDateRange(currentDateRange);
  }, [currentQ, currentSource, currentGender, currentStatus, currentDateRange]);

  // Função para aplicar os parâmetros na URL
  const applyFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Resetar para página 1 sempre que filtrar
    params.set('page', '1');

    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || value === 'all' || value.trim() === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounce da busca textual
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentQ) {
        applyFilters({ q: searchTerm });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSource('all');
    setGender('all');
    setStatus('active');
    setDateRange('all');
    setSheetOpen(false);

    startTransition(() => {
      router.push(pathname);
    });
  };

  const getSourceLabel = (src: string) => {
    if (src === 'all') return 'Todas as Origens';
    return sourceConfig[src as CustomerSource]?.label || 'Origem';
  };

  const hasAdvancedFilters = currentGender !== 'all' || currentDateRange !== 'all';
  const hasActiveFilters =
    Boolean(currentQ) ||
    currentSource !== 'all' ||
    currentGender !== 'all' ||
    currentStatus !== 'active' ||
    currentDateRange !== 'all';

  const advancedFiltersCount = (currentGender !== 'all' ? 1 : 0) + (currentDateRange !== 'all' ? 1 : 0);

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-3.5 sm:p-4.5 shadow-xs space-y-3">
      {/* Barra Principal de Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Campo de Busca Textual */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail ou CPF..."
            className="pl-9.5 pr-8 bg-zinc-900/80 border-zinc-800 focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 text-xs sm:text-sm text-white placeholder:text-zinc-500 h-11 rounded-xl w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-1"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grupo de Filtros Rápidos (Status + Origem + Botão Mais Filtros) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Seletor de Status */}
          <div className="w-full sm:w-44">
            <Select
              value={status}
              onValueChange={(val) => {
                const v = val || 'active';
                setStatus(v);
                applyFilters({ status: v });
              }}
            >
              <SelectTrigger className="h-11 w-full bg-zinc-900/80 border-zinc-800 text-xs sm:text-sm text-zinc-200 rounded-xl focus:border-[#c9a44c]">
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-4 h-4 text-[#c9a44c] shrink-0" />
                  <SelectValue placeholder="Status">{statusLabels[status] || 'Status'}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                <SelectItem value="active">Apenas Ativos</SelectItem>
                <SelectItem value="inactive">Apenas Inativos</SelectItem>
                <SelectItem value="all">Todos os Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Origem */}
          <div className="w-full sm:w-52">
            <Select
              value={source}
              onValueChange={(val) => {
                const v = val || 'all';
                setSource(v);
                applyFilters({ source: v });
              }}
            >
              <SelectTrigger className="h-11 w-full bg-zinc-900/80 border-zinc-800 text-xs sm:text-sm text-zinc-200 rounded-xl focus:border-[#c9a44c]">
                <div className="flex items-center gap-2 truncate">
                  <Tag className="w-4 h-4 text-zinc-400 shrink-0" />
                  <SelectValue placeholder="Origem">{getSourceLabel(source)}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs max-h-60">
                <SelectItem value="all">Todas as Origens</SelectItem>
                {Object.entries(sourceConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drawer de Filtros Avançados */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="h-11 px-4 bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-xl flex items-center gap-2 text-xs cursor-pointer font-semibold transition-all shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c9a44c]" />
              <span className="hidden sm:inline">Mais Filtros</span>
              <span className="sm:hidden">Filtros</span>
              {advancedFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#c9a44c] text-zinc-950">
                  {advancedFiltersCount}
                </span>
              )}
            </SheetTrigger>

            <SheetContent side="right" className="w-84 bg-[#0c0c0e] border-zinc-800 text-white p-6">
              <SheetHeader className="text-left pb-4 border-b border-zinc-800">
                <SheetTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#c9a44c]" />
                  Filtros Avançados
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Filtre por sexo do cliente e data em que o cadastro foi criado.
                </SheetDescription>
              </SheetHeader>

              <div className="py-5 space-y-4">
                {/* Sexo */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                    Sexo / Gênero
                  </label>
                  <Select value={gender} onValueChange={(v) => setGender(v || 'all')}>
                    <SelectTrigger className="h-11 bg-zinc-900 border-zinc-800 text-xs text-white rounded-xl focus:border-[#c9a44c]">
                      <SelectValue placeholder="Sexo">{genderLabels[gender] || 'Todos os Sexos'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                      <SelectItem value="all">Todos os Sexos</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="prefer_not_to_say">Não informado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Período de Entrada */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                    Data de Cadastro
                  </label>
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v || 'all')}>
                    <SelectTrigger className="h-11 bg-zinc-900 border-zinc-800 text-xs text-white rounded-xl focus:border-[#c9a44c]">
                      <SelectValue placeholder="Período">{dateRangeLabels[dateRange] || 'Qualquer data'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                      <SelectItem value="all">Qualquer data</SelectItem>
                      <SelectItem value="today">Cadastrados hoje</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="month">Neste mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                <Button
                  onClick={() => {
                    applyFilters({
                      gender,
                      date_range: dateRange,
                    });
                    setSheetOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black text-xs h-11 rounded-xl shadow-[0_0_15px_rgba(201,164,76,0.25)] cursor-pointer"
                >
                  Aplicar Filtros
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="w-full border-zinc-800 text-zinc-400 hover:text-white text-xs h-10 rounded-xl"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                    Limpar Todos os Filtros
                  </Button>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Botão Rápido de Limpar se houver filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="h-11 px-3 bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#c9a44c]" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Linha de Tags / Chips Ativos (quando aplicados) */}
      {(hasActiveFilters || isPending) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-medium mr-1">Filtros ativos:</span>

            {currentQ && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                Busca: <strong className="text-white font-medium truncate max-w-[120px]">"{currentQ}"</strong>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    applyFilters({ q: '' });
                  }}
                  className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentStatus !== 'active' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                Status: <strong className="text-white font-medium">{statusLabels[currentStatus] || currentStatus}</strong>
                <button
                  onClick={() => {
                    setStatus('active');
                    applyFilters({ status: 'active' });
                  }}
                  className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentSource !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                Origem: <strong className="text-white font-medium">{getSourceLabel(currentSource)}</strong>
                <button
                  onClick={() => {
                    setSource('all');
                    applyFilters({ source: 'all' });
                  }}
                  className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentGender !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                Sexo: <strong className="text-white font-medium">{genderLabels[currentGender] || currentGender}</strong>
                <button
                  onClick={() => {
                    setGender('all');
                    applyFilters({ gender: 'all' });
                  }}
                  className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {currentDateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                Data: <strong className="text-white font-medium">{dateRangeLabels[currentDateRange] || currentDateRange}</strong>
                <button
                  onClick={() => {
                    setDateRange('all');
                    applyFilters({ date_range: 'all' });
                  }}
                  className="text-zinc-500 hover:text-white ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {isPending && (
            <span className="text-[11px] text-[#e3c56c] font-medium animate-pulse">
              Atualizando clientes...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
