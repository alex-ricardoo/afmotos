'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit,
  Eye,
  Trash2,
  Bike,
  CheckCircle2,
  AlertCircle,
  Tag,
  Gauge,
  MoreVertical,
  Filter,
  X,
  Receipt,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  motorcycleStatusLabels,
  operationTypeLabels,
  ownershipTypeLabels,
} from '@/lib/utils/translations';
import { formatCurrency } from '@/lib/utils/format';
import { deleteMotorcycleAction, toggleMotorcycleStatus } from '@/lib/actions/motorcycles';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MotorcycleItem {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number;
  year_model: number;
  price: number | null;
  mileage: number | null;
  engine_capacity: number | null;
  status: string;
  ownership_type?: string | null;
  operation_type?: string | null;
  license_plate?: string | null;
  featured?: boolean | null;
  image_url?: string;
  internal_code?: string | null;
}

import { CONSTANTS } from '@/lib/utils/constants';

interface Props {
  initialData: MotorcycleItem[];
  siteName?: string;
}

export function AdminMotorcycleStock({ initialData, siteName }: Props) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Delete modal state
  const [motoToDelete, setMotoToDelete] = useState<MotorcycleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter local data based on status and search query
  const filteredMotos = initialData.filter((moto) => {
    const matchesStatus =
      activeStatus === 'ALL'
        ? true
        : activeStatus === 'CONSIGNMENT'
          ? moto.ownership_type === 'CONSIGNMENT'
          : moto.status === activeStatus;

    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      moto.brand.toLowerCase().includes(queryLower) ||
      moto.model.toLowerCase().includes(queryLower) ||
      (moto.version && moto.version.toLowerCase().includes(queryLower)) ||
      (moto.license_plate && moto.license_plate.toLowerCase().includes(queryLower)) ||
      (moto.internal_code && moto.internal_code.toLowerCase().includes(queryLower));

    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalMotos = initialData.length;
  const availableCount = initialData.filter((m) => m.status === 'AVAILABLE').length;
  const soldCount = initialData.filter((m) => m.status === 'SOLD').length;
  const consignmentCount = initialData.filter((m) => m.ownership_type === 'CONSIGNMENT').length;

  const handleStatusToggle = async (moto: MotorcycleItem) => {
    toast.promise(toggleMotorcycleStatus(moto.id, moto.status), {
      loading: 'Atualizando status...',
      success: (res) => {
        if (res.error) throw new Error(res.error);
        router.refresh();
        return 'Status atualizado com sucesso!';
      },
      error: (err) => err.message || 'Erro ao alterar status',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!motoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteMotorcycleAction(motoToDelete.id);
      if (res.error) {
        toast.error(`Erro ao excluir: ${res.error}`);
      } else {
        toast.success(`Moto "${motoToDelete.brand} ${motoToDelete.model}" excluída com sucesso!`);
        setMotoToDelete(null);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir moto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'RESERVED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'SOLD':
        return 'bg-[#c9a44c]/15 text-[#e3c56c] border-[#c9a44c]/30';
      case 'RENTED':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'MAINTENANCE':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Estoque de Motos
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              <Sparkles className="w-3 h-3" /> {storeName}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie o catálogo de motocicletas, fotos, preços e status de visibilidade.
          </p>
        </div>

        <Link
          href="/admin/motos/nova"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold rounded-xl px-5 h-11 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-sm',
          )}
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>Nova Motocicleta</span>
        </Link>
      </div>

      {/* 2. Stats Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 shadow-xs flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
              Total no Estoque
            </span>
            <span className="text-2xl font-black text-white tabular-nums mt-0.5 block">
              {totalMotos}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-300 border border-zinc-800">
            <Bike className="w-5 h-5 text-[#c9a44c]" />
          </div>
        </div>

        <div className="bg-zinc-950/70 p-4 rounded-2xl border border-emerald-500/25 shadow-xs flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <span className="text-[11px] font-bold text-emerald-400/90 block uppercase tracking-wider">
              Disponíveis
            </span>
            <span className="text-2xl font-black text-emerald-400 tabular-nums mt-0.5 block">
              {availableCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950/70 p-4 rounded-2xl border border-amber-500/25 shadow-xs flex items-center justify-between hover:border-amber-500/40 transition-colors">
          <div>
            <span className="text-[11px] font-bold text-[#e3c56c] block uppercase tracking-wider">
              Vendidas
            </span>
            <span className="text-2xl font-black text-[#e3c56c] tabular-nums mt-0.5 block">
              {soldCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#e3c56c] border border-amber-500/20">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 shadow-xs flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
              Consignadas
            </span>
            <span className="text-2xl font-black text-white tabular-nums mt-0.5 block">
              {consignmentCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
            <Filter className="w-5 h-5 text-[#c9a44c]" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Search, Filter Tabs & View Toggle) */}
      <div className="bg-zinc-950/70 p-4 rounded-3xl border border-zinc-800/80 shadow-xs space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por marca, modelo, versão ou placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11 bg-zinc-900/80 border-zinc-800 focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 rounded-xl text-sm w-full text-white placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle Buttons (Grid vs Table) */}
          <div className="flex items-center justify-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-bold gap-1.5 transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-[#c9a44c] text-zinc-950 shadow-xs hover:bg-[#e3c56c]'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-bold gap-1.5 transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-[#c9a44c] text-zinc-950 shadow-xs hover:bg-[#e3c56c]'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <List className="w-4 h-4" />
              <span>Tabela</span>
            </Button>
          </div>
        </div>

        {/* Filter Badges Tabs (Mobile-first scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'Todas as Motos' },
            { id: 'AVAILABLE', label: 'Disponíveis' },
            { id: 'SOLD', label: 'Vendidas' },
            { id: 'CONSIGNMENT', label: 'Consignação' },
            { id: 'RENTED', label: 'Alugadas' },
            { id: 'MAINTENANCE', label: 'Em Revisão' },
            { id: 'UNAVAILABLE', label: 'Indisponíveis' },
          ].map((tab) => {
            const isActive = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border text-xs cursor-pointer',
                  isActive
                    ? 'bg-[#c9a44c] text-zinc-950 border-[#c9a44c] shadow-xs'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-white hover:bg-zinc-800',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Content Area */}
      {filteredMotos.length === 0 ? (
        <div className="bg-zinc-950/70 rounded-3xl border border-zinc-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 mx-auto flex items-center justify-center text-zinc-500 border border-zinc-800">
            <Bike className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Nenhuma motocicleta encontrada</h3>
            <p className="text-xs text-zinc-400">
              Não encontramos registros com os filtros e busca selecionados. Tente ajustar os termos
              ou limpar os filtros.
            </p>
          </div>
          {(searchQuery || activeStatus !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveStatus('ALL');
              }}
              className="rounded-xl font-semibold border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF LUXURY CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMotos.map((moto) => (
            <div
              key={moto.id}
              className="group bg-zinc-950/70 rounded-3xl border border-zinc-800/80 hover:border-[#c9a44c]/40 overflow-hidden shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(201,164,76,0.1)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-zinc-900">
                {moto.image_url ? (
                  <Image
                    src={moto.image_url}
                    alt={`${moto.brand} ${moto.model}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-1.5">
                    <Bike className="w-10 h-10 opacity-30 text-[#c9a44c]" />
                    <span className="text-xs font-semibold">Sem foto cadastrada</span>
                  </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1 z-10 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider backdrop-blur-md px-2.5 py-0.5 rounded-lg',
                        getStatusBadgeStyle(moto.status),
                      )}
                    >
                      {motorcycleStatusLabels[moto.status as keyof typeof motorcycleStatusLabels] ||
                        moto.status}
                    </Badge>
                  </div>

                  {moto.ownership_type && (
                    <Badge
                      variant="outline"
                      className="bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-[#e3c56c] border-[#c9a44c]/40 uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-xs"
                    >
                      {ownershipTypeLabels[
                        moto.ownership_type as keyof typeof ownershipTypeLabels
                      ] || moto.ownership_type}
                    </Badge>
                  )}
                </div>

                {/* Bottom Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Card Main Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[#c9a44c] uppercase tracking-wider">
                      {moto.brand}
                    </span>
                    {moto.license_plate && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {moto.license_plate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg leading-snug text-white group-hover:text-[#e3c56c] transition-colors mt-0.5 line-clamp-1">
                    {moto.model}
                  </h3>
                  {moto.version && (
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{moto.version}</p>
                  )}

                  {/* Price */}
                  <div className="text-2xl font-black text-[#e3c56c] tracking-tight tabular-nums mt-2 font-mono">
                    {moto.price ? formatCurrency(moto.price) : 'Sob Consulta'}
                  </div>
                </div>

                {/* Attributes Pill Box */}
                <div className="grid grid-cols-3 gap-1.5 py-2 px-3 bg-zinc-900/60 rounded-2xl text-center text-xs font-semibold text-zinc-200 border border-zinc-800/80">
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-medium">Ano</span>
                    <span className="tabular-nums font-mono text-zinc-300">
                      {moto.year_manufacture}/{moto.year_model}
                    </span>
                  </div>
                  <div className="border-x border-zinc-800 px-1">
                    <span className="text-[10px] text-zinc-500 block font-medium">KM</span>
                    <span className="tabular-nums font-mono text-zinc-300">
                      {moto.mileage !== null && moto.mileage !== undefined
                        ? `${moto.mileage.toLocaleString('pt-BR')} km`
                        : '0 km'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-medium">Motor</span>
                    <span className="tabular-nums font-mono text-zinc-300">
                      {moto.engine_capacity ? `${moto.engine_capacity}cc` : 'Flex'}
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-zinc-900 flex items-center gap-2">
                  <Link
                    href={`/admin/motos/${moto.id}/editar`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'outline' }),
                      'flex-1 bg-zinc-900/80 hover:bg-[#c9a44c] hover:text-zinc-950 border-zinc-800 hover:border-[#c9a44c] font-bold rounded-xl h-10 transition-all gap-1.5 text-xs text-zinc-200 cursor-pointer',
                    )}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>

                  {/* Quick Sell Action for AVAILABLE motorcycles */}
                  {moto.status === 'AVAILABLE' && (
                    <Link
                      href={`/admin/vendas/nova?motorcycle_id=${moto.id}`}
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        'bg-amber-500/15 hover:bg-amber-500 text-[#e3c56c] hover:text-zinc-950 border border-amber-500/30 font-bold rounded-xl h-10 px-3 transition-all gap-1.5 text-xs cursor-pointer',
                      )}
                      title="Registrar venda desta moto"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Vender</span>
                    </Link>
                  )}

                  <a
                    href={`/motos/${moto.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'h-10 w-10 p-0 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:text-white text-zinc-400 shrink-0 cursor-pointer',
                    )}
                    title="Ver página pública no site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Dropdown Menu for Extra Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 p-0 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white shrink-0 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent
                      align="end"
                      className="w-52 bg-zinc-950 border-zinc-800 text-zinc-200"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-zinc-400 text-xs">
                          Ações do Veículo
                        </DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-zinc-800" />

                      <DropdownMenuItem
                        onClick={() => handleStatusToggle(moto)}
                        className="cursor-pointer text-xs"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                        <span>
                          {moto.status === 'AVAILABLE'
                            ? 'Marcar Indisponível'
                            : 'Marcar Disponível'}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => (window.location.href = `/admin/motos/${moto.id}/editar`)}
                        className="cursor-pointer text-xs"
                      >
                        <Edit className="mr-2 h-4 w-4 text-zinc-400" />
                        <span>Editar Detalhes</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-zinc-800" />

                      <DropdownMenuItem
                        className="text-rose-400 focus:bg-rose-950/30 focus:text-rose-300 cursor-pointer text-xs"
                        onClick={() => setMotoToDelete(moto)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir Moto</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-zinc-950/70 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/60 text-xs uppercase font-bold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">Moto</th>
                  <th className="py-3.5 px-4">Ano</th>
                  <th className="py-3.5 px-4">Placa</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4">Propriedade</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredMotos.map((moto) => (
                  <tr key={moto.id} className="hover:bg-zinc-900/40 transition-colors">
                    {/* Moto Image + Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800">
                          {moto.image_url ? (
                            <Image
                              src={moto.image_url}
                              alt={moto.model}
                              fill
                              unoptimized
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                              <Bike className="w-4 h-4 text-[#c9a44c]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-white leading-tight">
                            {moto.brand} {moto.model}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {moto.version || 'Edição Padrão'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="py-3 px-4 text-xs font-semibold tabular-nums text-zinc-300 font-mono">
                      {moto.year_manufacture}/{moto.year_model}
                    </td>

                    {/* License Plate */}
                    <td className="py-3 px-4 text-xs font-mono font-bold text-zinc-300">
                      {moto.license_plate || '-'}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-black text-[#e3c56c] tabular-nums text-sm font-mono">
                      {moto.price ? formatCurrency(moto.price) : 'Sob Consulta'}
                    </td>

                    {/* Ownership */}
                    <td className="py-3 px-4 text-xs font-medium text-zinc-400">
                      {ownershipTypeLabels[
                        moto.ownership_type as keyof typeof ownershipTypeLabels
                      ] || '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
                          getStatusBadgeStyle(moto.status),
                        )}
                      >
                        {motorcycleStatusLabels[
                          moto.status as keyof typeof motorcycleStatusLabels
                        ] || moto.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/motos/${moto.id}/editar`}
                          className={cn(
                            buttonVariants({ size: 'sm', variant: 'outline' }),
                            'h-8 px-3 rounded-xl text-xs font-bold bg-zinc-900 border-zinc-800 hover:bg-[#c9a44c] hover:text-zinc-950 transition-all text-zinc-200 cursor-pointer',
                          )}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Link>
                        <a
                          href={`/motos/${moto.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ size: 'sm', variant: 'ghost' }),
                            'h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer',
                          )}
                          title="Ver no site"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!motoToDelete} onOpenChange={(open) => !open && setMotoToDelete(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 pt-2">
              Tem certeza que deseja excluir permanentemente a motocicleta{' '}
              <strong className="text-white">
                {motoToDelete?.brand} {motoToDelete?.model} ({motoToDelete?.year_model})
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMotoToDelete(null)}
              disabled={isDeleting}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
