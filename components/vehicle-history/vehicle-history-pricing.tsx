'use client';

import React from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { VehicleHistorySettings } from '@/types/site-settings';
import {
  buildVehicleHistoryWhatsAppUrl,
  buildVehicleHistoryB2BWhatsAppUrl,
} from '@/lib/utils/whatsapp';

interface VehicleHistoryPricingProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

const B2C_INCLUDED = [
  'Link Exclusivo com Histórico Interativo no Celular',
  'Download Imediato em PDF Oficial para Guardar',
  'Comprovante de Procedência para Valorizar seu Bem',
  'Histórico Completo de Leilão, Sinistro & Débitos',
  'Gravames, Alienação & Bloqueios Judiciais Renajud',
  'Válido para Qualquer Veículo com Placa Nacional',
];

const VOLUME_BENEFITS = [
  'Créditos que não expiram',
  'Desconto progressivo por placa',
  'Para pessoa física ou lojistas',
  'Atendimento prioritário no WhatsApp',
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

  const handleB2CClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate: null,
      price: settings.price,
      siteName,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleB2BClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = buildVehicleHistoryB2BWhatsAppUrl(phone);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-12 sm:py-20 bg-[#080B11] border-t border-[#1F293D] relative overflow-hidden">
      {/* Glow Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Tabela Transparente
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Escolha a opção ideal para você
          </h2>
        </div>

        {/* Bloco A: Card Principal de Compra Avulsa (B2C) */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-[#131A26] border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1F293D]">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px] uppercase tracking-wider inline-block">
                CONSULTA AVULSA OFICIAL
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                Consulta Individual por Placa
              </h3>
              <p className="text-xs text-zinc-400">
                Link online + PDF oficial guardado para valorizar seu veículo na revenda
              </p>
            </div>

            <div className="flex flex-col md:items-end">
              <span className="text-xs text-zinc-500 line-through font-bold">
                De R$ 59,90
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Por apenas</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {formattedPrice}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium mt-0.5">
                ⚡ Pix com liberação instantânea
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div className="py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {B2C_INCLUDED.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Primário da Consulta Avulsa */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleB2CClick}
              className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <span>Consultar Veículo Agora por {formattedPrice}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Bloco B: Card Comercial de Pacotes com Desconto (Pessoa Física & Lojas) */}
        <div className="relative rounded-3xl p-6 sm:p-7 bg-[#0D111A] border border-[#1F293D] hover:border-emerald-500/40 transition-all duration-300 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Pacotes Econômicos • Pessoa Física & Lojas</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
              Vai avaliar vários veículos ou precisa de consultas frequentes?
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Garanta descontos progressivos comprando pacotes de consultas. Perfeito tanto para quem está comparando diferentes opções para comprar quanto para lojistas, corretores e autônomos.
            </p>

            {/* Micro Benefits Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {VOLUME_BENEFITS.map((benefit, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#131A26] border border-[#1F293D] text-[11px] text-zinc-300 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{benefit}</span>
                </span>
              ))}
            </div>
          </div>

          {/* CTA Volume (WhatsApp Direct) */}
          <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleB2BClick}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
              <span>Ver Pacotes com Desconto</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
