'use client';

import React from 'react';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Users,
  Zap,
  Lock,
  Sparkles,
  TrendingDown,
  FileCheck2,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { VehicleHistorySettings } from '@/types/site-settings';
import {
  buildVehicleHistoryWhatsAppUrl,
  buildVehicleHistoryB2BWhatsAppUrl,
} from '@/lib/utils/whatsapp';
import { useVehicleHistory } from './vehicle-history-context';

interface VehicleHistoryPricingProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

const CHECKLIST_ITEMS = [
  'Histórico de Leilão, Batidas Graves & Sinistro',
  'Alienação Fiduciária (Dívidas ativas com Bancos)',
  'Bloqueios na Justiça (Renajud) & Alerta de Furto',
  'Débitos Estaduais, IPVA e Multas em aberto',
  'Laudo Oficial em PDF + Link interativo no WhatsApp',
  'Suporte humano com especialista para tirar dúvidas',
];

export function VehicleHistoryPricing({
  settings,
  siteName,
  defaultPhone,
}: VehicleHistoryPricingProps) {
  const { plate, isValid, formattedPlate, scrollToSection } = useVehicleHistory();
  const phone = settings.whatsappPhoneOverride || defaultPhone;
  const rawPrice = settings.price || 39.90;
  const formattedPrice = rawPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleB2CClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!plate || !isValid) {
      scrollToSection('consulta-placa');
      return;
    }
    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate,
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
    <section id="precos-historico" className="py-12 sm:py-20 bg-[#080B11] border-t border-[#1F293D] relative overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Investimento Inteligente</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            O menor custo para evitar a maior dor de cabeça
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            Blindar sua compra antes de transferir dinheiro custa menos de uma troca de óleo.
          </p>
        </div>

        {/* Compact Loss Aversion & Competitor Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl bg-[#0F1420] border border-[#1F293D]">
          {/* Risk Pill */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-950/25 border border-red-500/20">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Risco sem o Laudo
              </span>
              <p className="text-xs text-zinc-300 leading-snug">
                Prejuízo de <strong className="text-red-300">R$ 5.000 a R$ 25.000</strong> com leilão maquiado, processo ou golpe.
              </p>
            </div>
          </div>

          {/* Solution & Competitor Price Anchor Pill */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Aqui na {siteName}
                </span>
                <span className="text-[10px] text-zinc-400 line-through">
                  Outros: R$ 64,90
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-snug">
                Mesmo laudo oficial por apenas <strong className="text-amber-400 font-mono text-sm">{formattedPrice}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Master Plan Checkout Card */}
        <div className="relative rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-[#131A26] to-[#0D121D] border-2 border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Card Header & Price Display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1F293D]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                  100% Oficial Senatran
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Economize R$ 25,00
                </span>
              </div>

              <h3 className="text-lg sm:text-2xl font-black text-white font-heading">
                {isValid && formattedPlate ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Laudo do Veículo Placa {formattedPlate}
                  </span>
                ) : (
                  'Laudo Oficial de Histórico Veicular'
                )}
              </h3>

              <p className="text-xs text-zinc-400">
                Válido para qualquer carro, moto ou caminhão em todo o Brasil.
              </p>
            </div>

            {/* Price Box */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-0 rounded-xl bg-slate-950/60 sm:bg-transparent border border-slate-800/80 sm:border-0">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-zinc-400 block sm:inline">
                  Em outros sites: <span className="line-through font-semibold text-zinc-500">R$ 64,90</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 block sm:hidden">
                  Preço exclusivo AF Motos
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-amber-300 uppercase sm:hidden">Por</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Included Features List */}
          <div className="py-5">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
              O que você recebe no laudo oficial:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {CHECKLIST_ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA & Micro-Guarantees */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              id="btn-pricing-consultar-avulso"
              onClick={handleB2CClick}
              className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50"
            >
              <span className="whitespace-nowrap">
                {isValid ? `Consultar Placa ${formattedPlate} Agora` : 'Consultar Minha Placa Agora'}
              </span>
              <ArrowRight className="w-5 h-5 stroke-[3] shrink-0" />
            </button>

            {/* Micro-Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Pagamento seguro Pix ou Cartão
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Envio em minutos no WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                PDF para salvar e imprimir
              </span>
            </div>
          </div>
        </div>

        {/* Discreet B2B / Volume Option */}
        <div className="p-4 rounded-2xl bg-[#0D111A] border border-[#1F293D] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Procura várias opções ou é lojista?
              </p>
              <p className="text-[11px] text-zinc-400">
                Temos pacotes de consultas com desconto progressivo por lote.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleB2BClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0 border border-slate-700"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400" />
            <span>Consultar Pacotes</span>
          </button>
        </div>
      </div>
    </section>
  );
}
