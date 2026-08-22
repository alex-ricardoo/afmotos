'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }: { row: any }) => {
      const type = row.getValue('type') as string;
      const typeMap: Record<string, string> = {
        SELL_MOTORCYCLE: 'Venda',
        CONSIGNMENT: 'Consignação',
        RENTAL: 'Aluguel',
        MOTORCYCLE_INTEREST: 'Interesse',
        GENERAL_CONTACT: 'Contato',
      };
      return <Badge variant="outline">{typeMap[type] || type}</Badge>;
    },
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: { row: any }) => {
      const status = row.getValue('status') as string;
      const statusMap: Record<
        string,
        { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
      > = {
        NEW: { label: 'Novo', variant: 'default' },
        CONTACTED: { label: 'Contatado', variant: 'secondary' },
        QUALIFIED: { label: 'Qualificado', variant: 'outline' },
        CONVERTED: { label: 'Convertido', variant: 'outline' },
        CLOSED: { label: 'Fechado', variant: 'secondary' },
        LOST: { label: 'Perdido', variant: 'destructive' },
      };

      const config = statusMap[status] || { label: status, variant: 'default' };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Data',
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue('created_at'));
      return <div>{format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>;
    },
  },
];
