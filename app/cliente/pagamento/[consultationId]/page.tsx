import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { getSiteSettings } from '@/lib/queries/settings';
import { VehicleConsultationOrderSummary } from '@/components/customer/vehicle-consultation-order-summary';
import { VehicleConsultationBenefits } from '@/components/customer/vehicle-consultation-benefits';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, MessageCircle } from 'lucide-react';

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

  const [
    { data: consultation, error: consultationError },
    price,
    settings,
  ] = await Promise.all([
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
          <VehicleConsultationOrderSummary
            plate={consultation.plate}
            amount={price}
          />
          <VehicleConsultationBenefits />
        </div>

        {/* Coluna Direita: Estado Claro de Indisponibilidade de Pagamento Online */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0 text-amber-400">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Pagamentos online estão temporariamente indisponíveis
                </h1>
                <p className="text-xs text-amber-400/90 font-medium">
                  Manutenção programada dos canais de pagamento
                </p>
              </div>
            </div>

            <div className="text-sm text-zinc-300 space-y-3 leading-relaxed border-t border-zinc-800/80 pt-4">
              <p>
                Estamos aprimorando nossa infraestrutura financeira para oferecer uma experiência de checkout
                mais ágil, transparente e segura.
              </p>
              <p>
                Por esse motivo, o processamento automatizado de novas cobranças via cartão, PIX e boleto está
                momentaneamente suspenso nesta página.
              </p>
              <p className="text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                🔒 <strong>Importante:</strong> Sua consulta para a placa{' '}
                <span className="font-mono text-white font-semibold">{consultation.plate}</span> está salva
                em sua conta com status pendente. Nenhuma cobrança foi realizada e nenhum dado financeiro foi retido.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com Atendimento
                  </Button>
                </a>
              )}
              <Link href="/cliente/consultas" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                >
                  Ver Minhas Consultas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
