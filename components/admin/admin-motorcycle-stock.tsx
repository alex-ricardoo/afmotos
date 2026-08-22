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
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
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

interface Props {
  initialData: MotorcycleItem[];
}

export function AdminMotorcycleStock({ initialData }: Props) {
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
    <div className="space-y-6">
      {/* 1. Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Estoque de Motos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie o catálogo de motocicletas, fotos, preços e status de visibilidade.
          </p>
        </div>

        <Link
          href="/admin/motos/nova"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold rounded-xl px-5 h-11 shadow-[0_0_15px_rgba(201,164,76,0.2)] transition-all flex items-center justify-center gap-2 shrink-0',
          )}
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>Nova Motocicleta</span>
        </Link>
      </div>

      {/* 2. Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
              Total no Estoque
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">{totalMotos}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
            <Bike className="w-5 h-5 text-[#c9a44c]" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-emerald-500/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400/90 block uppercase">
              Disponíveis
            </span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">
              {availableCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-[#c9a44c]/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#e3c56c] block uppercase">
              Vendidas
            </span>
            <span className="text-xl font-bold text-[#e3c56c] tabular-nums">{soldCount}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#c9a44c]/10 flex items-center justify-center text-[#e3c56c]">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
              Consignadas
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {consignmentCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <Filter className="w-5 h-5 text-[#c9a44c]" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Search, Filter Tabs & View Toggle) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por marca, modelo, versão ou placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11 bg-background/50 border-border/60 focus:border-[#c9a44c] rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle Buttons (Grid vs Table) */}
          <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl border border-border/60 self-end md:self-auto">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 transition-all',
                viewMode === 'grid' && 'bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40',
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                'h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 transition-all',
                viewMode === 'table' && 'bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40',
              )}
            >
              <List className="w-4 h-4" />
              <span>Tabela</span>
            </Button>
          </div>
        </div>

        {/* Filter Badges Tabs */}
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
                  'px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-[#c9a44c] text-black border-[#c9a44c] shadow-xs'
                    : 'bg-background/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-secondary',
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
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <Bike className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-foreground">Nenhuma motocicleta encontrada</h3>
            <p className="text-xs text-muted-foreground">
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
              className="rounded-xl font-semibold border-border"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredMotos.map((moto) => (
            <div
              key={moto.id}
              className="group bg-card rounded-2xl border border-border/80 hover:border-[#c9a44c]/50 overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(201,164,76,0.15)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-border/40">
                {moto.image_url ? (
                  <Image
                    src={moto.image_url}
                    alt={`${moto.brand} ${moto.model}`}
                    fill
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
                        'text-[10px] font-bold uppercase tracking-wider backdrop-blur-md px-2 py-0.5',
                        getStatusBadgeStyle(moto.status),
                      )}
                    >
                      {motorcycleStatusLabels[
                        moto.status as keyof typeof motorcycleStatusLabels
                      ] || moto.status}
                    </Badge>
                  </div>

                  {moto.ownership_type && (
                    <Badge
                      variant="outline"
                      className="bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-[#e3c56c] border-[#c9a44c]/40 uppercase tracking-wider px-2 py-0.5"
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
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[#c9a44c] uppercase tracking-wider">
                      {moto.brand}
                    </span>
                    {moto.license_plate && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {moto.license_plate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg leading-snug text-foreground group-hover:text-[#e3c56c] transition-colors mt-0.5 line-clamp-1">
                    {moto.model}
                  </h3>
                  {moto.version && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {moto.version}
                    </p>
                  )}

                  {/* Price */}
                  <div className="text-xl sm:text-2xl font-black text-[#e3c56c] tracking-tight tabular-nums mt-2">
                    {moto.price ? formatCurrency(moto.price) : 'Sob Consulta'}
                  </div>
                </div>

                {/* Attributes Pill Box */}
                <div className="grid grid-cols-3 gap-1.5 py-2 px-3 bg-secondary/50 rounded-xl text-center text-xs font-semibold text-foreground border border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Ano
                    </span>
                    <span className="tabular-nums">
                      {moto.year_manufacture}/{moto.year_model}
                    </span>
                  </div>
                  <div className="border-x border-border/60 px-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">KM</span>
                    <span className="tabular-nums">
                      {moto.mileage !== null && moto.mileage !== undefined
                        ? `${moto.mileage.toLocaleString('pt-BR')} km`
                        : '0 km'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Motor
                    </span>
                    <span className="tabular-nums">
                      {moto.engine_capacity ? `${moto.engine_capacity}cc` : 'Flex'}
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                  <Link
                    href={`/admin/motos/${moto.id}/editar`}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'outline' }),
                      'flex-1 bg-background hover:bg-[#c9a44c] hover:text-black border-[#c9a44c]/30 font-bold rounded-xl h-10 transition-all gap-1.5 text-xs',
                    )}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>

                  <a
                    href={`/motos/${moto.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'ghost' }),
                      'h-10 w-10 p-0 rounded-xl border border-border/60 hover:bg-secondary hover:text-foreground text-muted-foreground shrink-0',
                    )}
                    title="Ver no site"
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  {/* Dropdown Menu for Extra Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 p-0 rounded-xl border border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => handleStatusToggle(moto)}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                        <span>
                          {moto.status === 'AVAILABLE'
                            ? 'Marcar Indisponível'
                            : 'Marcar Disponível'}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => (window.location.href = `/admin/motos/${moto.id}/editar`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar Detalhes</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
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
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase font-bold text-muted-foreground border-b border-border/60">
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
              <tbody className="divide-y divide-border/60">
                {filteredMotos.map((moto) => (
                  <tr key={moto.id} className="hover:bg-secondary/30 transition-colors">
                    {/* Moto Image + Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-border/60">
                          {moto.image_url ? (
                            <Image
                              src={moto.image_url}
                              alt={moto.model}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-900">
                              <Bike className="w-4 h-4 text-[#c9a44c]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-foreground leading-tight">
                            {moto.brand} {moto.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {moto.version || 'Edição Padrão'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="py-3 px-4 text-xs font-semibold tabular-nums text-foreground">
                      {moto.year_manufacture}/{moto.year_model}
                    </td>

                    {/* License Plate */}
                    <td className="py-3 px-4 text-xs font-mono font-bold text-zinc-300">
                      {moto.license_plate || '-'}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-black text-[#e3c56c] tabular-nums text-sm">
                      {moto.price ? formatCurrency(moto.price) : 'Sob Consulta'}
                    </td>

                    {/* Ownership */}
                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {ownershipTypeLabels[
                        moto.ownership_type as keyof typeof ownershipTypeLabels
                      ] || '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
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
                            'h-8 px-3 rounded-lg text-xs font-bold bg-background border-[#c9a44c]/30 hover:bg-[#c9a44c] hover:text-black transition-all',
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
                            'h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground',
                          )}
                          title="Ver no site"
                        >
                          <Eye className="w-4 h-4" />
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
        <DialogContent className="max-w-md bg-[#151515] border-[#c9a44c]/30 text-[#f4f4f2]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-sm text-[#a6a6a1] pt-2">
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
              className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
