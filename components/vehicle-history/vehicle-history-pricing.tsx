'use client';

import React from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { VehicleHistorySettings } from '@/types/site-settings';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';

interface VehicleHistoryPricingProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

const INCLUDED_ITEMS = [
  'Consulta oficial nas bases Senatran, Renajud e Detran',
  'Histórico completo de Leilão, Batidas e Sinistro',
  'Checagem de Gravame, Financiamento e Restrições',
  'Débitos de IPVA, Licenciamento e Multas Renainf',
  'Histórico de Proprietários e Referência Tabela FIPE',
  'Download imediato e envio do laudo em PDF no WhatsApp',
];

export function VehicleHistoryPricing({
  settings,
  siteName,
  defaultPhone,
}: VehicleHistoryPricingProps) {
  const phone = settings.whatsappPhoneOverride || defaultPhone;
  const formattedPrice = settings.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate: null,
      price: settings.price,
      siteName,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 sm:py-24 bg-[#0D111A] border-t border-[#1F293D] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparência & Valor</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Invista pouco para proteger milhares de reais
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Acesso completo a todas as bases com preço promocional de liberação imediata.
          </p>
        </div>

        {/* Pricing Card with Anchored Price & Oferta Limitada */}
        <div className="relative rounded-3xl p-6 sm:p-10 bg-[#131A26] border-2 border-amber-500/50 shadow-2xl shadow-amber-500/15 backdrop-blur-xl">
          {/* Oferta Limitada Floating Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>OFERTA LIMITADA</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#1F293D]">
            <div className="space-y-1.5 pt-2 md:pt-0">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Relatório Veicular Completo por Placa
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
                Laudo de Procedência Oficial
              </h3>
              <p className="text-xs text-zinc-400">
                Válido para carros, motos e utilitários em todo o Brasil
              </p>
            </div>

            <div className="flex flex-col md:items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 line-through font-bold">
                  De R$ 59,90
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Economize 33%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Por apenas</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                  {formattedPrice}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">
                ⚡ Pagamento 100% no WhatsApp via Pix
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div className="py-8 space-y-4">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Tudo o que está incluído no seu laudo:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INCLUDED_ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Action */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="w-6 h-6 fill-slate-950 shrink-0" />
              <span>Quero Proteger Minha Compra por {formattedPrice}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            <p className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Garantia de atendimento ágil da equipe AF Motos.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
