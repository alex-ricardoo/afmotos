'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { leadTypeLabels, leadStatusLabels } from '@/lib/utils/translations';

export const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }: { row: any }) => {
      const type = row.getValue('type') as keyof typeof leadTypeLabels;
      const label = leadTypeLabels[type] || type;
      return (
        <Badge variant="outline" className="border-primary/30 text-primary">
          {label}
        </Badge>
      );
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
      const status = row.getValue('status') as keyof typeof leadStatusLabels;
      const label = leadStatusLabels[status] || status;

      const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        NEW: 'default',
        CONTACTED: 'secondary',
        QUALIFIED: 'outline',
        CONVERTED: 'outline',
        CLOSED: 'secondary',
        LOST: 'destructive',
      };

      const variant = variantMap[status] || 'default';
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Data',
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue('created_at'));
      return (
        <div className="text-muted-foreground">
          {format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      );
    },
  },
];
