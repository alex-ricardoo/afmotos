import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CustomerSource } from '@/types/customer';
import {
  UserCheck,
  Globe,
  Tag,
  MessageSquare,
  Receipt,
  KeyRound,
  FileSignature,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';

export const sourceConfig: Record<
  CustomerSource,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  manual: {
    label: 'Cadastro Manual',
    icon: UserCheck,
    colorClass: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60',
  },
  website_sell_request: {
    label: 'Site — Venda de Moto',
    icon: Tag,
    colorClass: 'bg-amber-950/30 text-amber-300 border-amber-800/40',
  },
  website_consignment_request: {
    label: 'Site — Deixar para Vender',
    icon: FileSignature,
    colorClass: 'bg-purple-950/30 text-purple-300 border-purple-800/40',
  },
  website_contact: {
    label: 'Site — Contato Geral',
    icon: MessageSquare,
    colorClass: 'bg-sky-950/30 text-sky-300 border-sky-800/40',
  },
  sale_registration: {
    label: 'Registro de Venda',
    icon: Receipt,
    colorClass: 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40',
  },
  rental_registration: {
    label: 'Aluguel de Moto',
    icon: KeyRound,
    colorClass: 'bg-blue-950/30 text-blue-300 border-blue-800/40',
  },
  admin_proposal: {
    label: 'Proposta Balcão',
    icon: Globe,
    colorClass: 'bg-indigo-950/30 text-indigo-300 border-indigo-800/40',
  },
  imported: {
    label: 'Base Importada',
    icon: FileSpreadsheet,
    colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  },
  other: {
    label: 'Outra Origem',
    icon: HelpCircle,
    colorClass: 'bg-zinc-900 text-zinc-400 border-zinc-800',
  },
};

interface CustomerSourceBadgeProps {
  source: CustomerSource;
  className?: string;
}

export function CustomerSourceBadge({ source, className }: CustomerSourceBadgeProps) {
  const config = sourceConfig[source] || sourceConfig.other;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium gap-1 px-2 py-0.5 inline-flex items-center shadow-xs',
        config.colorClass,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
