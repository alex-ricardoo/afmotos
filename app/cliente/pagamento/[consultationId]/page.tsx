import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentSimulation } from '@/components/customer/payment-simulation';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';

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

  const [{ data: consultation, error }, price] = await Promise.all([
    supabase
      .from('customer_plate_consultations')
      .select('id, plate, status, payment_status')
      .eq('id', consultationId)
      .eq('user_id', user.id)
      .maybeSingle(),
    getVehicleConsultationPrice(),
  ]);

  if (error || !consultation) {
    notFound();
  }

  // We do not redirect here so that Next.js Server Action revalidation does not interrupt the client-side progress animation.

  return (
    <div className="py-6 sm:py-10">
      <PaymentSimulation consultation={consultation} price={price} />
    </div>
  );
}
