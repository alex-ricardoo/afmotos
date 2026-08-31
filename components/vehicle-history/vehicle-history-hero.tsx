'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Zap, MessageCircle, ArrowRight } from 'lucide-react';
import { MercosulPlateInput } from './mercosul-plate-input';
import { VehicleHistorySettings } from '@/types/site-settings';
import { isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';

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
  const [plate, setPlate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phone = settings.whatsappPhoneOverride || defaultPhone;

  const handlePlateChange = (newPlate: string) => {
    setPlate(newPlate);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleConsultarClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!plate || plate.trim().length === 0) {
      setErrorMessage('Digite a placa da moto ou carro para consultar.');
      return;
    }

    if (!isValidBrazilianPlate(plate)) {
      setErrorMessage('Informe uma placa válida no padrão Mercosul ou antigo (ex: ABC1D23 ou ABC-1234).');
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
    <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-20 bg-[#080B11]">
      {/* Glow Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6">
          {/* Tag de Urgência & Segurança */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-bold tracking-wide shadow-sm animate-in fade-in slide-in-from-top-3 duration-500">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Consulta Veicular Oficial • Carros & Motos</span>
          </div>

          {/* Headline Poderosa & Direta */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl font-heading">
            Não caia em golpes.{' '}
            <span className="bg-gradient-to-r from-[#fde68a] via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent">
              Consulte o histórico completo antes de fechar negócio.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg lg:text-xl text-zinc-300 max-w-2xl leading-relaxed">
            Descubra leilão, gravame/financiamento, sinistro, multas e débitos com atendimento ágil e 100% humanizado apenas pela placa.
          </p>

          {/* Box de Input da Placa e CTA Primário */}
          <div className="w-full max-w-md pt-2 space-y-4">
            <div className="bg-[#131A26] border border-[#1F293D] rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="text-center space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Digite a placa do veículo:
                </label>
                <p className="text-[11px] text-zinc-400">
                  Padrão Mercosul (<span className="text-amber-400 font-mono">BRA2E19</span>) ou Antigo (<span className="text-amber-400 font-mono">ABC-1234</span>)
                </p>
              </div>

              {/* Mercosul Plate Input */}
              <MercosulPlateInput
                value={plate}
                onChange={handlePlateChange}
                error={errorMessage}
                autoFocus={false}
              />

              {/* Botão de CTA Primário Dourado / Âmbar */}
              <button
                type="button"
                onClick={handleConsultarClick}
                className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span>Consultar Histórico Agora</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* Gatilhos de Confiança Imediatos (Logo abaixo do botão) */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bases Oficiais Senatran & Detran</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Atendimento 100% Humano</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <span>Receba em PDF no WhatsApp</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
