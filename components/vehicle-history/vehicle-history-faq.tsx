'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { cn } from '@/lib/utils';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';
import { VEHICLE_HISTORY_FAQS } from './vehicle-history-faq-data';

export { VEHICLE_HISTORY_FAQS };

interface VehicleHistoryFaqProps {
  siteName: string;
  phone: string;
  price: number;
}

/**
 * VehicleHistoryFaq - Accordion de Perguntas Frequentes
 * 
 * Decisões de UX/UI aplicadas:
 * 1. Superfície: bg-slate-900/80 com border-white/5 e backdrop-blur-sm.
 * 2. Transições Suaves: Abertura e fechamento com grid-rows animado em CSS ou transição com rotação do ícone.
 * 3. Acessibilidade & Touch Target: Botões de abertura com min-height de 56px e focus-visible acessível.
 * 4. CTA de Suporte WhatsApp: Botão esmeralda (bg-emerald-600 hover:bg-emerald-700) com feedback tátil (active:scale-[0.98]).
 */
export function VehicleHistoryFaq({
  siteName,
  phone,
  price,
}: VehicleHistoryFaqProps) {
  const [openId, setOpenId] = useState<string | null>(VEHICLE_HISTORY_FAQS[0].id);

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleDuvidasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate: null,
      price,
      siteName,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-12 sm:py-20 bg-slate-950 border-t border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Perguntas Frequentes</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-50 tracking-tight font-heading">
            Tire todas as suas dúvidas
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Respostas diretas sobre a consulta e entrega do relatório pela {siteName}.
          </p>
        </div>

        {/* Lista Accordion com Áreas de Toque Mínimas de 48px */}
        <div className="space-y-3.5">
          {VEHICLE_HISTORY_FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={cn(
                  'rounded-3xl border transition-all duration-300 overflow-hidden',
                  'bg-slate-900/80 backdrop-blur-sm shadow-lg shadow-black/30',
                  isOpen
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-white/5 hover:border-white/10',
                )}
              >
                <button
                  type="button"
                  id={`faq-btn-${faq.id}`}
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full min-h-[56px] p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-50 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300',
                      isOpen
                        ? 'rotate-180 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400',
                    )}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {/* Conteúdo Expansível com Transição Suave */}
                <div
                  id={`faq-answer-${faq.id}`}
                  role="region"
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bloco de Suporte no WhatsApp (CTA Secundário de Contato) */}
        <div className="mt-10 p-6 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/30 text-center space-y-3.5">
          <p className="text-sm sm:text-base font-bold text-slate-50">
            Ainda tem alguma dúvida antes de solicitar seu laudo?
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Nossa equipe comercial e de suporte está pronta para responder suas dúvidas sobre placas, laudos e faturamento PJ.
          </p>
          <button
            type="button"
            id="btn-faq-whatsapp-suporte"
            onClick={handleDuvidasClick}
            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-transform duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
            <span>Falar com nosso time no WhatsApp</span>
          </button>
        </div>
      </div>
    </section>
  );
}
