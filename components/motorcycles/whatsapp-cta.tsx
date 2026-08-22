'use client';

import React from 'react';
import { MessageCircle, Calculator, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

interface WhatsAppCTAProps {
  motorcycle: {
    brand: string;
    model: string;
    version?: string | null;
    year_model: number;
    price?: number | null;
  };
  className?: string;
}

export function WhatsAppCTA({ motorcycle, className }: WhatsAppCTAProps) {
  const phone = CONSTANTS?.CONTACT_PHONE || '5511999999999';

  const interestMessage = generateMotorcycleInterestMessage(motorcycle);
  const financingMessage = `Olá! Gostaria de simular um financiamento para a ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}). Como podemos proceder?`;
  const tradeInMessage = `Olá! Tenho interesse na moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}) e gostaria de dar minha moto usada como entrada.`;

  const interestUrl = generateWhatsAppLink(phone, interestMessage);
  const financingUrl = generateWhatsAppLink(phone, financingMessage);
  const tradeInUrl = generateWhatsAppLink(phone, tradeInMessage);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Primary WhatsApp Action */}
      <a
        href={interestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.99]"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span>Falar com Consultor</span>
      </a>

      {/* Secondary CTAs (Financing & Trade-in) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          href={financingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4f4f2] border border-[#c9a44c]/20 hover:border-[#c9a44c]/50 text-xs font-bold transition-all shadow-xs"
        >
          <Calculator className="w-4 h-4 text-[#e3c56c]" />
          <span>Simular Financiamento</span>
        </a>

        <a
          href={tradeInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4f4f2] border border-[#c9a44c]/20 hover:border-[#c9a44c]/50 text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-[#e3c56c]" />
          <span>Dar Moto na Troca</span>
        </a>
      </div>

      {/* Trust & Response guarantee */}
      <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-[#a6a6a1] font-medium border-t border-[#c9a44c]/20">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#e3c56c]" />
          Resposta média em 5 min
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#e3c56c]" />
          Negociação 100% segura
        </span>
      </div>
    </div>
  );
}
