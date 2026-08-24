'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Bike, Home, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { formatCurrency } from '@/lib/utils';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';

interface VendaMotoSuccessViewProps {
  proposalId?: string | null;
  brand: string;
  model: string;
  yearModel: number;
  fipePrice?: number | null;
  estimatedOffer?: number | null;
  name: string;
  onReset?: () => void;
}

export function VendaMotoSuccessView({
  proposalId,
  brand,
  model,
  yearModel,
  fipePrice,
  estimatedOffer,
  name,
  onReset,
}: VendaMotoSuccessViewProps) {
  const whatsappUrl = generateWhatsAppLink(
    CONSTANTS.CONTACT_PHONE,
    `Olá! Sou ${name}, acabei de enviar a proposta de venda da minha moto ${brand} ${model} (${yearModel}) pelo site da AF Motos e gostaria de acompanhar a avaliação.`,
  );

  return (
    <div className="text-center py-8 sm:py-12 space-y-8 animate-in fade-in zoom-in-95 duration-300 max-w-xl mx-auto">
      {/* Success Badge & Animated Glow */}
      <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
        <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="relative w-full h-full rounded-3xl bg-zinc-900 border-2 border-amber-500 text-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)]">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proposta Recebida com Sucesso</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
          Obrigado, {name.split(' ')[0]}!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
          Recebemos as informações e fotos da sua{' '}
          <strong>
            {brand} {model}
          </strong>
          . Nossa equipe vai analisar os dados e entrar em contato pelo WhatsApp para alinhar a
          avaliação.
        </p>
      </div>

      {/* Resumo Card da Proposta */}
      <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 text-left space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white">
              {brand} {model} ({yearModel})
            </span>
          </div>
          {proposalId && (
            <span className="text-[10px] font-mono text-zinc-500">
              ID: {proposalId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {fipePrice != null && fipePrice > 0 && (
            <div>
              <span className="text-zinc-500 block text-[11px]">Referência FIPE</span>
              <span className="font-bold text-zinc-300 font-mono">{formatCurrency(fipePrice)}</span>
            </div>
          )}
          {estimatedOffer != null && estimatedOffer > 0 && (
            <div>
              <span className="text-amber-400/90 block text-[11px] font-bold">
                Estimativa Simulada
              </span>
              <span className="font-black text-amber-400 font-mono text-sm">
                {formatCurrency(estimatedOffer)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ações de Conversão & Navegação */}
      <div className="space-y-3 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] cursor-pointer"
        >
          <WhatsAppIcon className="w-4 h-4 fill-current" />
          <span>Falar com a AF Motos no WhatsApp</span>
        </a>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Link
            href="/motos"
            className="w-full sm:w-1/2 h-11 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Bike className="w-4 h-4 text-amber-400" />
            <span>Ver Motos Disponíveis</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-1/2 h-11 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-amber-400/80 hover:text-amber-300 underline font-medium pt-2 transition-colors cursor-pointer"
          >
            Avaliar outra motocicleta
          </button>
        )}
      </div>
    </div>
  );
}
