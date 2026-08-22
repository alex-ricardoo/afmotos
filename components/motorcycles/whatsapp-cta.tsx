'use client';

import React from 'react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';
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
  const questionsMessage = `Olá! Gostaria de tirar algumas dúvidas sobre a ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}).`;
  const tradeInMessage = `Olá! Tenho interesse na moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}) e gostaria de saber se aceita troca.`;

  const interestUrl = generateWhatsAppLink(phone, interestMessage);
  const questionsUrl = generateWhatsAppLink(phone, questionsMessage);
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
        <WhatsAppIcon className="w-6 h-6 fill-current" />
        <span>Falar no WhatsApp</span>
      </a>

      {/* Secondary CTAs (Questions & Trade-in) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          href={questionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4f4f2] border border-[#c9a44c]/20 hover:border-[#c9a44c]/50 text-xs font-bold transition-all shadow-xs"
        >
          <WhatsAppIcon className="w-4 h-4 text-[#25D366] fill-current" />
          <span>Tirar Dúvidas</span>
        </a>

        <a
          href={tradeInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4f4f2] border border-[#c9a44c]/20 hover:border-[#c9a44c]/50 text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-[#e3c56c]" />
          <span>Propor Troca</span>
        </a>
      </div>

      {/* Trust info */}
      <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-[#a6a6a1] font-medium border-t border-[#c9a44c]/20">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#e3c56c]" />
          Atendimento direto
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#e3c56c]" />
          Negociação transparente
        </span>
      </div>
    </div>
  );
}
