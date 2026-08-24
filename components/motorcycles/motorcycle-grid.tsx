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
  viewMode?: 'grid' | 'list';
  whatsappPhone?: string;
}

export function MotorcycleGrid({
  motorcycles,
  emptyMessage = 'Nenhuma moto encontrada com os filtros selecionados.',
  viewMode = 'grid',
  whatsappPhone,
}: MotorcycleGridProps) {
  const whatsappUrl = generateWhatsAppLink(
    whatsappPhone,
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

  const needsLeadMagnet = viewMode === 'grid' && motorcycles.length > 0 && motorcycles.length % 3 !== 0;

  return (
    <div
      className={cn(
        'gap-6',
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
          : 'flex flex-col space-y-4',
      )}
    >
      {motorcycles.map((moto) => (
        <div key={moto.id} className={viewMode === 'list' ? 'w-full' : ''}>
          <MotorcycleCard motorcycle={moto} whatsappPhone={whatsappPhone} />
        </div>
      ))}
      
      {needsLeadMagnet && (
        <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-zinc-900/40 p-5 flex flex-col justify-center items-center text-center space-y-3 min-h-[240px] hover:border-amber-500/60 transition-colors">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <SearchX className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Procurando outro modelo?</h3>
            <p className="text-xs text-zinc-400 mt-1.5">
              Não encontrou o ano ou a versão exata que você quer? Encomende com a gente.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)] mt-2"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>Encomendar no WhatsApp</span>
          </a>
        </div>
      )}
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
