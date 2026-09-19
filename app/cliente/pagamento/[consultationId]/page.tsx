import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { getSiteSettings } from '@/lib/queries/settings';
import { VehicleConsultationOrderSummary } from '@/components/customer/vehicle-consultation-order-summary';
import { VehicleConsultationBenefits } from '@/components/customer/vehicle-consultation-benefits';
import { CheckoutProButton } from '@/components/customer/checkout-pro-button';
import { PayWithCreditButton } from '@/components/customer/pay-with-credit-button';
import { getUserCreditBalance } from '@/lib/credits/credit-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, MessageCircle, Sparkles } from 'lucide-react';
import {
  PixBrandIcon,
  MercadoPagoBrandIcon,
  CreditCardBrandIcon,
  CaixaDebitBrandIcon,
} from '@/components/customer/payment-brand-icons';

interface PaymentPageProps {
  params: Promise<{
    consultationId: string;
  }>;
}

export const metadata = {
  title: 'Pagamento Seguro da Consulta | Área do Cliente | AF Motos',
  description: 'Finalize o pagamento da sua consulta veicular com segurança pelo Mercado Pago.',
};

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { consultationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/cliente/login?returnUrl=/cliente/pagamento/${consultationId}`);
  }

  const [{ data: consultation, error: consultationError }, price, settings, creditBalance] = await Promise.all([
    supabase
      .from('customer_plate_consultations')
      .select('id, user_id, plate, status, payment_status')
      .eq('id', consultationId)
      .maybeSingle(),
    getVehicleConsultationPrice(),
    getSiteSettings(),
    getUserCreditBalance(user.id),
  ]);

  if (consultationError || !consultation) {
    notFound();
  }

  // Validação de acesso: apenas o proprietário da consulta ou administradores
  const isOwner = consultation.user_id === user.id;
  if (!isOwner) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!adminProfile) {
      notFound();
    }
  }

  // Se a consulta já foi concluída/paga, direciona diretamente para o laudo
  if (consultation.status === 'completed' || consultation.payment_status === 'paid') {
    redirect(`/cliente/consultas/${consultation.id}`);
  }

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  const supportPhone = settings?.whatsapp_phone || null;
  const whatsappUrl = supportPhone
    ? `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Gostaria de suporte sobre a consulta da placa ${consultation.plate} (ID: ${consultation.id}).`,
      )}`
    : null;

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* Botão de retorno seguro */}
      <div className="flex items-center justify-between">
        <Link
          href="/cliente/consultas"
          className="group inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar para Minhas Consultas
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          <Sparkles className="h-3 w-3" />
          Aguardando Pagamento
        </span>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Coluna Esquerda: Resumo da Consulta e Benefícios */}
        <div className="lg:col-span-5 space-y-6">
          <VehicleConsultationOrderSummary plate={consultation.plate} amount={price} />
          <div className="hidden lg:block">
            <VehicleConsultationBenefits />
          </div>
        </div>

        {/* Coluna Direita: Checkout Pro Mercado Pago */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 p-4 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl shadow-black/80 backdrop-blur-xl">
            {/* Ambient Lighting Glows */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#009EE3]/15 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />

            {/* Cabeçalho do Card com Logo Oficial Mercado Pago */}
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-white/90 text-[#009EE3] shrink-0 shadow-lg shadow-black/40">
                <MercadoPagoBrandIcon
                  className="h-6 w-6 sm:h-7 sm:w-7 text-[#009EE3]"
                  aria-hidden="true"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-zinc-950 text-white shadow-sm">
                  <Lock className="h-2 w-2" />
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                    Finalizar Pagamento Seguro
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-sky-400 border border-blue-500/30 shrink-0">
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="truncate">Processado via Mercado Pago</span>
                </p>
              </div>
            </div>

            {/* Formas de Pagamento com SVGs Oficiais */}
            <div className="relative space-y-3 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-300 font-medium">
                  Escolha como prefere pagar no ambiente oficial:
                </p>
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  100% Criptografado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {/* Pix Oficial */}
                <div className="group/item flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/90 hover:border-[#32BCAD]/50 hover:bg-[#32BCAD]/[0.03] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#32BCAD]/15 border border-[#32BCAD]/30 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                      <PixBrandIcon className="h-4.5 w-4.5 text-[#32BCAD]" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-200 group-hover/item:text-white transition-colors">
                      Pix Instantâneo
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    Aprovação imediata
                  </span>
                </div>

                {/* Cartão de Crédito com Bandeiras */}
                <div className="group/item flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/90 hover:border-sky-500/40 hover:bg-sky-500/[0.03] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                      <CreditCardBrandIcon className="h-4.5 w-4.5 text-sky-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-200 group-hover/item:text-white transition-colors">
                      Cartão de Crédito
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                    Em até 12x
                  </span>
                </div>

                {/* Cartão de Débito - Caixa */}
                <div className="group/item flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/90 hover:border-[#005ca9]/50 hover:bg-[#005ca9]/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#005ca9]/20 border border-[#005ca9]/40 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                      <CaixaDebitBrandIcon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-200 group-hover/item:text-white transition-colors">
                      Cartão de Débito
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-sky-300 bg-[#005ca9]/20 border border-[#005ca9]/35 px-2 py-0.5 rounded-md">
                    Exclusivo Caixa Virtual
                  </span>
                </div>

                {/* Saldo Mercado Pago */}
                <div className="group/item flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/90 hover:border-sky-500/40 hover:bg-sky-500/[0.03] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                      <MercadoPagoBrandIcon className="h-4.5 w-4.5 text-sky-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-200 group-hover/item:text-white transition-colors">
                      Saldo Mercado Pago
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                    À vista em conta
                  </span>
                </div>
              </div>
            </div>

            {/* Botão Oficial do Checkout Pro com valor integrado no CTA */}
            <div className="pt-2">
              <CheckoutProButton consultationId={consultation.id} amountText={formattedPrice} />
              
              {/* Pagamento com Crédito (B2B) */}
              {creditBalance > 0 && (
                <PayWithCreditButton
                  consultationId={consultation.id}
                  balance={creditBalance}
                  plate={consultation.plate}
                />
              )}
            </div>

            {/* Links Auxiliares */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-3 border-t border-zinc-800/60">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-500/20 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-500/40 hover:text-emerald-200 flex items-center justify-center gap-2 text-xs py-4 sm:py-5 rounded-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Dúvidas? Atendimento WhatsApp</span>
                  </Button>
                </a>
              )}
              <Link href="/cliente/consultas" className="flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-white hover:bg-white/5 text-xs py-3 sm:py-5 rounded-xl transition-all cursor-pointer"
                >
                  Pagar mais tarde
                </Button>
              </Link>
            </div>
          </div>

          {/* No mobile, os benefícios aparecem após o checkout */}
          <div className="block lg:hidden">
            <VehicleConsultationBenefits />
          </div>
        </div>
      </div>
    </div>
  );
}
