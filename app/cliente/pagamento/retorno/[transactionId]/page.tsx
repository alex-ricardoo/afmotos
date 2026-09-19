import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries/settings';
import { PaymentReturnStatus } from '@/components/customer/payment-return-status';
import { ArrowLeft } from 'lucide-react';
import { type PaymentTransactionStatus } from '@/lib/mercadopago/types';

interface ReturnPageProps {
  params: Promise<{
    transactionId: string;
  }>;
}

export const metadata = {
  title: 'Retorno do Pagamento | Área do Cliente | AF Veículos PE',
  description: 'Confirmação e acompanhamento do pagamento da consulta veicular.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentReturnPage({ params }: ReturnPageProps) {
  const { transactionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/cliente/login?returnUrl=/cliente/pagamento/retorno/${transactionId}`);
  }

  // 1. Carrega a transação garantindo titularidade
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .select('id, consultation_id, user_id, status, status_detail, transaction_amount')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    notFound();
  }

  // Validação de acesso: apenas o dono da transação ou administradores
  const isOwner = transaction.user_id === user.id;
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

  // 2. Carrega a consulta veicular associada
  const [{ data: consultation, error: consultationError }, settings] = await Promise.all([
    supabase
      .from('customer_plate_consultations')
      .select('id, plate, status, payment_status')
      .eq('id', transaction.consultation_id)
      .maybeSingle(),
    getSiteSettings(),
  ]);

  if (consultationError || !consultation) {
    notFound();
  }

  const supportPhone = settings?.whatsapp_phone || null;
  const shortRef = consultation.id.slice(0, 8).toUpperCase();
  const whatsappUrl = supportPhone
    ? `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Preciso de ajuda com uma consulta veicular.\nReferência: ${shortRef}\nStatus: acompanhamento de laudo veicular`,
      )}`
    : null;

  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      <div>
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Minhas Consultas
        </Link>
      </div>

      <PaymentReturnStatus
        transactionId={transaction.id}
        consultationId={consultation.id}
        plate={consultation.plate}
        initialStatus={transaction.status as PaymentTransactionStatus}
        initialConsultationStatus={consultation.status}
        whatsappUrl={whatsappUrl}
      />
    </div>
  );
}
