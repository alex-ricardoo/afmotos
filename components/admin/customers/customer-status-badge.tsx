import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface CustomerStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function CustomerStatusBadge({ isActive, className }: CustomerStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-emerald-950/30 text-emerald-400 border-emerald-800/40 text-[11px] font-medium gap-1 px-2 py-0.5',
          className,
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Ativo
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-zinc-900 text-zinc-400 border-zinc-700/50 text-[11px] font-medium gap-1 px-2 py-0.5',
        className,
      )}
    >
      <XCircle className="w-3 h-3 text-zinc-400" />
      Inativo
    </Badge>
  );
}
