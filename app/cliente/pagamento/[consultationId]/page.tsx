import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentSimulation } from '@/components/customer/payment-simulation';

interface PaymentPageProps {
  params: Promise<{
    consultationId: string;
  }>;
}

export const metadata = {
  title: 'Pagamento da Consulta | Área do Cliente | AF Motos',
  description: 'Confirmação e pagamento da consulta veicular.',
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

  const { data: consultation, error } = await supabase
    .from('customer_plate_consultations')
    .select('id, plate, status, payment_status')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !consultation) {
    notFound();
  }

  // If already completed, redirect straight to the result view
  if (consultation.status === 'completed') {
    redirect(`/cliente/consultas/${consultation.id}`);
  }

  return (
    <div className="py-6 sm:py-10">
      <PaymentSimulation consultation={consultation} />
    </div>
  );
}
