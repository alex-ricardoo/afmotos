'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Lead } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { leadTypeLabels, leadStatusLabels } from '@/lib/utils/translations';

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = String(row.getValue('type') || '');
      const label = leadTypeLabels[type] || type;
      return <Badge variant="outline">{label}</Badge>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = String(row.getValue('status') || '');
      const label = leadStatusLabels[status] || status;

      const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        NEW: 'default',
        novo: 'default',
        IN_CONTACT: 'secondary',
        em_contato: 'secondary',
        CONTACTED: 'secondary',
        QUALIFIED: 'outline',
        NEGOTIATING: 'outline',
        negociando: 'outline',
        CONVERTED: 'outline',
        ganho: 'outline',
        CLOSED: 'secondary',
        LOST: 'destructive',
        perdido: 'destructive',
      };

      const variant = variantMap[status] || 'default';
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Data',
    cell: ({ row }) => {
      const val = row.getValue('created_at');
      const date = val ? new Date(String(val)) : new Date();
      return (
        <div className="text-muted-foreground">
          {format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      );
    },
  },
];
