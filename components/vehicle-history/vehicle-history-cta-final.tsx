'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { VehicleHistorySettings } from '@/types/site-settings';
import { useVehicleHistory } from './vehicle-history-context';

interface VehicleHistoryCtaFinalProps {
  settings: VehicleHistorySettings;
  siteName?: string;
  defaultPhone: string;
}

/**
 * VehicleHistoryCtaFinal - Seção Final de Fechamento de Vendas
 * Visual premium mobile-first com botões táteis de alta conversão.
 */
export function VehicleHistoryCtaFinal({ settings, defaultPhone }: VehicleHistoryCtaFinalProps) {
  const { isValid, formattedPlate, scrollToSection } = useVehicleHistory();
  const phone = settings.whatsappPhoneOverride || defaultPhone;
  const formattedPrice = settings.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleSolicitarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection('consulta-placa');
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
    <section className="py-16 sm:py-24 bg-slate-950 border-t border-white/5 relative overflow-hidden text-center">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-950/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-5xl font-black text-slate-50 tracking-tight font-heading leading-tight">
            Proteja seu dinheiro.{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Compre e venda sem surpresas.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Consulte 100% online via Mercado Pago e acesse sua plataforma exclusiva de laudos salvos
            com download em PDF para imprimir por apenas{' '}
            <strong className="text-amber-400 font-bold">{formattedPrice}</strong>. Evite prejuízos
            irreversíveis e feche seu negócio com total tranquilidade.
          </p>
        </div>

        {/* Action Buttons (min 48px touch targets) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <button
            type="button"
            id="btn-cta-final-consultar"
            onClick={handleSolicitarClick}
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2.5 transition-transform duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50"
          >
            <span>
              {isValid ? `Consultar Placa ${formattedPlate}` : 'Consultar Histórico Agora'}
            </span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            id="btn-cta-final-duvidas"
            onClick={handleDuvidasClick}
            className="w-full sm:w-auto min-h-[52px] px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white font-semibold text-sm transition-transform duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400" />
            <span>Tirar dúvidas no WhatsApp</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Checkout Seguro Mercado Pago</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span>Laudos Salvos Vitalícios</span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span>PDF Oficial para Imprimir</span>
        </p>

        {/* B2B / Lojista Callout */}
        <div className="pt-4 border-t border-white/5 max-w-lg mx-auto">
          <p className="text-xs text-slate-400">
            É lojista, frotista ou precisa de várias consultas?{' '}
            <Link
              href="/cliente/creditos"
              className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 transition-colors inline-flex items-center gap-1"
            >
              Ver pacotes com até 15% OFF na Área do Cliente
              <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
