'use client';

import React from 'react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { RefreshCw, Zap, ShieldCheck, Clock } from 'lucide-react';
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
  whatsappPhone?: string;
  phone?: string;
  className?: string;
}

export function WhatsAppCTA({ motorcycle, whatsappPhone, phone, className }: WhatsAppCTAProps) {
  const contactPhone = whatsappPhone || phone;

  const interestMessage = generateMotorcycleInterestMessage(motorcycle);
  const tradeInMessage = `Olá! Tenho interesse na moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}) e gostaria de saber sobre a possibilidade de dar outra moto na troca.`;

  const interestUrl = generateWhatsAppLink(contactPhone, interestMessage);
  const tradeInUrl = generateWhatsAppLink(contactPhone, tradeInMessage);


  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-3">
        {/* Primary WhatsApp Action */}
        <a
          href={interestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.99] cursor-pointer min-h-[50px]"
        >
          <WhatsAppIcon className="w-5 h-5 fill-current" />
          <span>Negociar no WhatsApp</span>
        </a>

        {/* Distinct Secondary Action: Propor Troca */}
        <a
          href={tradeInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4f4f2] border border-[#c9a44c]/20 hover:border-[#e3c56c]/60 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#e3c56c]" />
          <span>Avaliar Minha Moto na Troca</span>
        </a>
      </div>

      {/* Trust info unificados */}
      <div className="flex flex-col gap-2.5 pt-3 px-1 text-xs text-[#a6a6a1] font-medium border-t border-[#c9a44c]/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#e3c56c] shrink-0" />
          <span>Atendimento direto e negociação rápida</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#e3c56c] shrink-0" />
          <span>Transparência total na documentação</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#e3c56c] shrink-0" />
          <span>Visitação com agendamento prévio no WhatsApp</span>
        </div>
      </div>
    </div>
  );
}
