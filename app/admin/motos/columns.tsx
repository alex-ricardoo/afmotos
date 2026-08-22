'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Eye, MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'internal_code',
    header: 'Código',
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
  },
  {
    accessorKey: 'year_model',
    header: 'Ano',
  },
  {
    accessorKey: 'price',
    header: 'Preço',
    cell: ({ row }: { row: any }) => {
      const price = parseFloat(row.getValue('price') || '0');
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(price);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const moto = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-[min(var(--radius-md),10px)] text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open(`/motos/${moto.slug}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" /> Ver no site
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (window.location.href = `/admin/motos/${moto.id}/editar`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
