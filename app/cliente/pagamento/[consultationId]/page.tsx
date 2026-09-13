import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { getSiteSettings } from '@/lib/queries/settings';
import { VehicleConsultationOrderSummary } from '@/components/customer/vehicle-consultation-order-summary';
import { VehicleConsultationBenefits } from '@/components/customer/vehicle-consultation-benefits';
import { CheckoutProButton } from '@/components/customer/checkout-pro-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';

interface PaymentPageProps {
  params: Promise<{
    consultationId: string;
  }>;
}

export const metadata = {
  title: 'Pagamento da Consulta | Área do Cliente | AF Motos',
  description: 'Informações sobre o pagamento da consulta veicular.',
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

  const [{ data: consultation, error: consultationError }, price, settings] = await Promise.all([
    supabase
      .from('customer_plate_consultations')
      .select('id, user_id, plate, status, payment_status')
      .eq('id', consultationId)
      .maybeSingle(),
    getVehicleConsultationPrice(),
    getSiteSettings(),
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

  const supportPhone = settings?.whatsapp_phone || null;
  const whatsappUrl = supportPhone
    ? `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Gostaria de suporte sobre a consulta da placa ${consultation.plate} (ID: ${consultation.id}).`,
      )}`
    : null;

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Botão de retorno seguro */}
      <div>
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Minhas Consultas
        </Link>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Esquerda: Resumo da Consulta e Benefícios */}
        <div className="lg:col-span-5 space-y-6">
          <VehicleConsultationOrderSummary plate={consultation.plate} amount={price} />
          <VehicleConsultationBenefits />
        </div>

        {/* Coluna Direita: Checkout Pro Mercado Pago */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 text-blue-400">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Finalizar Pagamento Seguro
                </h1>
                <p className="text-xs text-zinc-400 font-medium">
                  Processado diretamente pelo Mercado Pago
                </p>
              </div>
            </div>

            <div className="text-sm text-zinc-300 space-y-3 leading-relaxed border-t border-zinc-800/80 pt-4">
              <p>
                Ao clicar no botão abaixo, você será redirecionado para o ambiente oficial e
                criptografado do <strong className="text-white">Mercado Pago</strong>, onde poderá
                escolher pagar via:
              </p>
              <ul className="grid grid-cols-2 gap-2 text-xs text-zinc-300 font-medium pt-1">
                <li className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Pix Instantâneo
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Cartão de Crédito em até 12x
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Cartão de Débito
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Boleto Bancário / Saldo MP
                </li>
              </ul>
            </div>

            {/* Botão Oficial do Checkout Pro */}
            <div className="pt-2">
              <CheckoutProButton consultationId={consultation.id} />
            </div>

            {/* Links Auxiliares */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/60">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2 text-xs"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    Dúvidas? Atendimento WhatsApp
                  </Button>
                </a>
              )}
              <Link href="/cliente/consultas" className="flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-white text-xs"
                >
                  Pagar mais tarde
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
