import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { MotorcycleCard, MotorcycleCardData } from './motorcycle-card';
import { buttonVariants } from '@/components/ui/button';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';

interface MotorcycleGridProps {
  motorcycles: MotorcycleCardData[];
  emptyMessage?: string;
}

export function MotorcycleGrid({
  motorcycles,
  emptyMessage = 'Nenhuma moto encontrada com os filtros selecionados.',
}: MotorcycleGridProps) {
  const whatsappUrl = generateWhatsAppLink(
    CONSTANTS.CONTACT_PHONE,
    'Olá! Não encontrei a moto que estou procurando no estoque. Vocês têm previsão de novos modelos?',
  );

  if (!motorcycles || motorcycles.length === 0) {
    return (
      <div className="w-full py-16 px-4 text-center bg-[#151515] rounded-3xl border border-[#c9a44c]/20 shadow-xs flex flex-col items-center justify-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#202020] border border-[#c9a44c]/30 flex items-center justify-center text-[#e3c56c]">
          <SearchX className="w-8 h-8 text-[#e3c56c]" />
        </div>

        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-bold text-white font-heading">Estoque em Atualização</h3>
          <p className="text-sm text-[#a6a6a1] leading-relaxed">{emptyMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'rounded-xl font-semibold text-xs h-10 px-5 bg-[#202020] border-[#c9a44c]/30 text-white hover:bg-[#c9a44c] hover:text-black transition-all',
            )}
          >
            Limpar Filtros
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants(),
              'bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl font-semibold text-xs h-10 px-5 flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.2)] transition-all',
            )}
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>Consultar Próximas Entradas</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {motorcycles.map((moto) => (
        <MotorcycleCard key={moto.id} motorcycle={moto} />
      ))}
    </div>
  );
}

export function MotorcycleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-xs animate-pulse"
        >
          <div className="aspect-[16/10] bg-muted/80" />
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
            <div className="h-10 bg-muted/60 rounded-xl" />
            <div className="pt-2 flex items-center justify-between border-t border-border/40">
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="w-8 h-8 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
