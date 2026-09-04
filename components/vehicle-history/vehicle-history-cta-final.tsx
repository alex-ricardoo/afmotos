'use client';

import React from 'react';
import { ShieldCheck, MessageCircle, ArrowRight, Lock } from 'lucide-react';
import { VehicleHistorySettings } from '@/types/site-settings';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';
import { useVehicleHistory } from './vehicle-history-context';

interface VehicleHistoryCtaFinalProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

export function VehicleHistoryCtaFinal({
  settings,
  siteName,
  defaultPhone,
}: VehicleHistoryCtaFinalProps) {
  const { plate, isValid, formattedPlate, scrollToSection } = useVehicleHistory();
  const phone = settings.whatsappPhoneOverride || defaultPhone;
  const formattedPrice = settings.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleSolicitarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!plate) {
      scrollToSection('btn-hero-consultar-placa');
      return;
    }
    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate: isValid ? plate : null,
      price: settings.price,
      siteName,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDuvidasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const message = isValid
      ? `Olá! Gostaria de tirar uma dúvida sobre a consulta da placa ${formattedPlate} antes de fechar.`
      : 'Olá! Gostaria de tirar uma dúvida sobre a consulta veicular antes de fechar.';
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-[#080B11] via-[#0D111A] to-[#080B11] border-t border-[#1F293D] relative overflow-hidden text-center">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Proteja seu dinheiro.{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Compre e venda sem surpresas.
            </span>
          </h2>
          {/* Strict max 3 lines paragraph */}
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Receba o link online e baixe o laudo oficial em PDF em minutos por apenas <strong className="text-amber-400 font-bold">{formattedPrice}</strong>.
            Evite prejuízos irreversíveis e feche seu negócio com total tranquilidade.
          </p>
        </div>

        {/* Action Buttons (min 48px touch targets) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            type="button"
            id="btn-cta-final-consultar"
            onClick={handleSolicitarClick}
            className="w-full sm:w-auto min-h-[52px] px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50"
          >
            <span>{isValid ? `Consultar Placa ${formattedPlate}` : 'Consultar Histórico Agora'}</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>

          <button
            type="button"
            id="btn-cta-final-duvidas"
            onClick={handleDuvidasClick}
            className="w-full sm:w-auto min-h-[52px] px-6 py-4 rounded-xl bg-[#131A26] hover:bg-[#1A2333] border border-[#1F293D] text-zinc-300 hover:text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Tirar dúvidas no WhatsApp</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bases Oficiais Senatran & Detran • Atendimento ágil {siteName}</span>
        </p>
      </div>
    </section>
  );
}

