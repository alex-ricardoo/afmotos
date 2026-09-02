'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';

interface VehicleHistoryFaqProps {
  siteName: string;
  phone: string;
  price: number;
}

const FAQS = [
  {
    id: 'states',
    question: 'A consulta funciona para qualquer estado do Brasil?',
    answer: 'Sim! O laudo consulta diretamente as bases nacionais integradas do Senatran, Renajud e Detrans de todos os 26 estados e do Distrito Federal.',
  },
  {
    id: 'delivery-time',
    question: 'Em quanto tempo recebo o laudo após o pagamento?',
    answer: 'O processo é ágil e 100% humanizado. Assim que o Pix é confirmado no WhatsApp, um consultor da nossa equipe confere a placa, processa a consulta oficial nas bases e envia o arquivo PDF completo no seu chat em poucos minutos.',
  },
  {
    id: 'vehicle-types',
    question: 'A consulta serve para qualquer tipo de veículo com placa no Brasil?',
    answer: 'Sim! A consulta atende 100% dos veículos emplacados em território nacional: motocicletas, ciclomotores, carros de passeio, SUVs, caminhonetes, picapes, vans, utilitários e caminhões — seja com placa Mercosul ou no padrão tradicional antigo de qualquer estado.',
  },
  {
    id: 'sale-proof',
    question: 'Como o laudo me ajuda a valorizar o veículo na hora da venda?',
    answer: 'Você receberá um link exclusivo interativo com o histórico completo e poderá baixar o laudo oficial em PDF. Ter esse laudo guardado e apresentá-lo na negociação elimina as desconfianças do comprador, comprova que não há leilão, sinistro nem débitos ocultos, evita pedidos abusivos de desconto e acelera o fechamento da venda pelo valor justo de mercado!',
  },
  {
    id: 'packages-discount',
    question: 'Pessoa física pode comprar pacotes com desconto para avaliar vários veículos?',
    answer: 'Sim, com certeza! Se você está pesquisando várias opções antes de fechar a compra do seu veículo, ou se você negocia veículos com frequência, oferecemos pacotes com desconto progressivo por placa. Os créditos não expiram e você pode consultar placas de qualquer estado do Brasil no seu tempo. Chame nosso atendimento no WhatsApp para conhecer a tabela!',
  },
];

export function VehicleHistoryFaq({
  siteName,
  phone,
  price,
}: VehicleHistoryFaqProps) {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

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
    <section className="py-16 sm:py-24 bg-[#080B11] border-t border-[#1F293D] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Perguntas Frequentes</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Tire todas as suas dúvidas
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Respostas diretas sobre a consulta e entrega do relatório pela {siteName}.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden',
                  isOpen
                    ? 'bg-[#131A26] border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-[#0D111A] border-[#1F293D] hover:border-zinc-700',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 transition-transform duration-300',
                      isOpen ? 'rotate-180 bg-amber-400 text-zinc-950' : 'text-zinc-400',
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    role="region"
                    className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 border-t border-[#1F293D] pt-4"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WhatsApp Help Box */}
        <div className="mt-10 p-6 rounded-2xl bg-[#131A26] border border-[#1F293D] text-center space-y-3">
          <p className="text-sm font-semibold text-white">
            Ainda tem alguma dúvida antes de solicitar seu laudo?
          </p>
          <button
            type="button"
            onClick={handleDuvidasClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Falar com nosso time no WhatsApp</span>
          </button>
        </div>
      </div>
    </section>
  );
}
