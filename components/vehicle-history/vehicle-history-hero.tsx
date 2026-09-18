'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, FileDown, Link2, Loader2, MessageCircle, Coins, Sparkles } from 'lucide-react';
import { MercosulPlateInput } from './mercosul-plate-input';
import { VehicleHistorySettings } from '@/types/site-settings';
import { isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { buildVehicleHistoryWhatsAppUrl } from '@/lib/utils/whatsapp';
import { useVehicleHistory } from './vehicle-history-context';
import { createClient } from '@/lib/supabase/client';
import { initiateConsultation } from '@/lib/customer/consultation-service';
import { AuthModal } from '@/components/customer/auth-modal';
import { toast } from 'sonner';

interface VehicleHistoryHeroProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
}

export function VehicleHistoryHero({ settings, siteName, defaultPhone }: VehicleHistoryHeroProps) {
  const router = useRouter();
  const { plate, setPlateInput, scrollToSection } = useVehicleHistory();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phone = settings.whatsappPhoneOverride || defaultPhone;

  const handlePlateChange = (newPlate: string) => {
    setPlateInput(newPlate);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const processConsultation = async (targetPlate: string) => {
    setIsSubmitting(true);
    try {
      const res = await initiateConsultation(targetPlate);
      if (res.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.consultationId) {
        toast.success('Consulta iniciada! Redirecionando...');
        router.push(`/cliente/pagamento/${res.consultationId}`);
      } else {
        router.push('/cliente');
      }
    } catch (err) {
      console.error('Error starting consultation:', err);
      toast.error('Erro ao iniciar consulta.');
      setIsSubmitting(false);
    }
  };

  const handleConsultarClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!plate || plate.trim().length === 0) {
      setErrorMessage('Digite a placa para consultar o histórico antes de pagar.');
      return;
    }

    if (!isValidBrazilianPlate(plate)) {
      setErrorMessage(
        'Informe uma placa válida no padrão Mercosul (ABC1D23) ou antigo (ABC-1234).',
      );
      return;
    }

    setErrorMessage(null);

    // Check user authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    await processConsultation(plate);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!plate || !isValidBrazilianPlate(plate)) {
      setErrorMessage('Digite uma placa válida antes de chamar no WhatsApp.');
      return;
    }

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
    <section className="relative overflow-hidden pt-8 pb-14 lg:pt-16 lg:pb-24 bg-slate-950">
      {/* Responsive Background Image */}
      <div
        className="absolute inset-0 z-0 bg-[url('/historico-hero-mobile.png')] md:bg-[url('/historico-hero-desktop.png')] bg-cover bg-center bg-no-repeat opacity-90 md:opacity-85"
        style={{ objectPosition: 'center top' }}
      />

      {/* Subtle top/bottom gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/70 via-transparent via-50% to-slate-950 pointer-events-none" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.2) 60%, rgba(2,6,23,0.9) 100%)',
        }}
      />

      {/* Glow Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent blur-3xl z-0 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
          {/* Faixa de Oferta com Micro-gradiente sutil */}
          <Link
            href="/cliente/creditos"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent hover:from-amber-500/25 hover:to-amber-500/15 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all duration-200 group shadow-md backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>É lojista ou frotista? <strong>Pacotes com até 15% OFF</strong> na Área do Cliente</span>
            <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          {/* Headline de Alta Conversão */}
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-slate-50 tracking-tight leading-[1.15] max-w-4xl font-heading drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            Evite perder dinheiro.{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Consulte o histórico antes de fechar o negócio.
            </span>
          </h1>

          {/* Trust Badge destacado diretamente abaixo do título */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verifique 100+ pontos do veículo com 1 clique</span>
          </div>

          {/* Sub-headline acessível e escaneável */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Descubra leilão escondido, dívidas bancárias e bloqueios judiciais em segundos. Checkout
            oficial Mercado Pago, laudos salvos para sempre na sua conta e download em PDF para
            imprimir.
          </p>

          {/* Card de Input de Placa & CTA Primário */}
          <div id="consulta-placa" className="w-full max-w-md pt-2 space-y-4 scroll-mt-6">
            <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40 backdrop-blur-sm space-y-5">
              <div className="text-center space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Digite a placa para checar o histórico
                </label>
              </div>

              {/* Input Mercosul */}
              <MercosulPlateInput
                value={plate}
                onChange={handlePlateChange}
                error={errorMessage}
                autoFocus={false}
              />

              <p className="text-[11px] text-slate-400">
                Válido para qualquer carro, moto ou caminhão do Brasil.
              </p>

              {/* Botão Primário de Compra - Azul de Conversão e Segurança */}
              <button
                type="button"
                id="btn-hero-consultar-placa"
                onClick={handleConsultarClick}
                disabled={isSubmitting}
                className="w-full min-h-[52px] py-3.5 px-4 sm:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="whitespace-nowrap">Iniciando Consulta...</span>
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap">Consultar Placa Agora</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5] shrink-0" />
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors py-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dúvidas sobre a placa? Fale com nosso suporte no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('precos-historico')}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-amber-400 underline underline-offset-2 py-1 transition-colors cursor-pointer"
                >
                  Ver tabela de preços e o que está incluso no laudo ↓
                </button>

                <div className="pt-2 mt-1 border-t border-white/5 w-full text-center">
                  <Link
                    href="/cliente/creditos"
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors group"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Precisa de várias consultas? <strong>Ver pacotes na Área do Cliente</strong></span>
                    <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Micro-garantias e Trust Triggers */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-3 sm:gap-x-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Mercado Pago Oficial</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Link2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Laudos Salvos no Painel</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <FileDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PDF para Imprimir</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Múltiplas Consultas</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        plate={plate}
        onSuccess={() => processConsultation(plate)}
      />
    </section>
  );
}
