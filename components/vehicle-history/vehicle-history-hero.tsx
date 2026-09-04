'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, FileDown, Link2, AlertTriangle } from 'lucide-react';
import { MercosulPlateInput } from './mercosul-plate-input';
import { VehicleHistorySettings } from '@/types/site-settings';
import { isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';
import { useVehicleHistory } from './vehicle-history-context';

interface VehicleHistoryHeroProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

export function VehicleHistoryHero({
  settings,
  siteName,
  defaultPhone,
}: VehicleHistoryHeroProps) {
  const { plate, setPlateInput, scrollToSection } = useVehicleHistory();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phone = settings.whatsappPhoneOverride || defaultPhone;

  const handlePlateChange = (newPlate: string) => {
    setPlateInput(newPlate);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleConsultarClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!plate || plate.trim().length === 0) {
      setErrorMessage('Digite a placa para consultar o histórico antes de pagar.');
      return;
    }

    if (!isValidBrazilianPlate(plate)) {
      setErrorMessage('Informe uma placa válida no padrão Mercosul (ABC1D23) ou antigo (ABC-1234).');
      return;
    }

    setErrorMessage(null);

    const url = buildVehicleHistoryWhatsAppUrl({
      phone,
      plate,
      price: settings.price,
      template: settings.whatsappMessageTemplate,
      siteName,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-14 lg:pt-16 lg:pb-24 bg-[#080B11]">
      {/* Responsive Background Image */}
      <div
        className="absolute inset-0 z-0 bg-[url('/historico-hero-mobile.png')] md:bg-[url('/historico-hero-desktop.png')] bg-cover bg-center bg-no-repeat opacity-95 md:opacity-90"
        style={{ objectPosition: 'center top' }}
      />

      {/* Subtle top/bottom gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#080B11]/60 via-transparent via-50% to-[#080B11] pointer-events-none" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(8,11,17,0.45) 0%, rgba(8,11,17,0.2) 60%, rgba(8,11,17,0.85) 100%)',
        }}
      />

      {/* Glow Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl z-0 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6">

          {/* CRO Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl font-heading drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            Evite perder dinheiro.{' '}
            <span className="bg-gradient-to-r from-[#fde68a] via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent">
              Consulte o histórico antes de fechar o negócio.
            </span>
          </h1>

          {/* Sub-headline: strictly max 3 lines */}
          <p className="text-base sm:text-lg lg:text-xl text-zinc-200 max-w-2xl leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Descubra leilão escondido, dívidas bancárias e bloqueios judiciais em segundos.
            Receba o laudo oficial em PDF direto no seu WhatsApp e compre com total segurança.
          </p>

          {/* Plate Input Box & Primary CTA */}
          <div id="consulta-placa" className="w-full max-w-md pt-2 space-y-4 scroll-mt-6">
            <div className="bg-[#131A26] border border-[#1F293D] rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="text-center space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Digite a placa para checar o histórico
                </label>
               
              </div>

              {/* Mercosul Plate Input */}
              <MercosulPlateInput
                value={plate}
                onChange={handlePlateChange}
                error={errorMessage}
                autoFocus={false}
              />

              <p className="text-[11px] text-zinc-400">
                Válido para qualquer carro, moto ou caminhão do Brasil.
              </p>

              {/* Primary CTA - Warm Amber / Orange (Single-line standardized button) */}
              <button
                type="button"
                id="btn-hero-consultar-placa"
                onClick={handleConsultarClick}
                className="w-full min-h-[52px] py-3.5 px-4 sm:px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50"
              >
                <span className="whitespace-nowrap">Consultar Placa Agora</span>
                <ArrowRight className="w-5 h-5 stroke-[3] shrink-0" />
              </button>


              <button
                type="button"
                onClick={() => scrollToSection('precos-historico')}
                className="w-full text-xs font-semibold text-zinc-400 hover:text-amber-400 underline underline-offset-2 py-1 transition-colors"
              >
                Ver tabela de preços e o que está incluso no laudo ↓
              </button>
            </div>

            {/* Trust Triggers */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-3 sm:gap-x-4 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Mais barato que concorrentes</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Link2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Link Online Imediato</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <FileDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PDF Oficial</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Suporte Humano</span>
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
