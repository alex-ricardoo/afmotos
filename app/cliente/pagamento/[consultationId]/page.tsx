import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { getMercadoPagoPublicKey, isDevPaymentSimulationEnabled } from '@/lib/mercadopago/client';
import { CustomerPaymentFlow } from '@/components/customer/customer-payment-flow';
import { getSiteSettings } from '@/lib/queries/settings';

interface PaymentPageProps {
  params: Promise<{
    consultationId: string;
  }>;
}

export const metadata = {
  title: 'Pagamento Seguro da Consulta | Área do Cliente | AF Motos',
  description: 'Confirmação e pagamento seguro do histórico veicular oficial.',
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

  // 1. Fetch consultation using service role to prevent RLS mismatches or partial schema issues
  const adminSupabase = createAdminClient();

  const [{ data: consultation, error: consultationError }, price, settings] = await Promise.all([
    adminSupabase
      .from('customer_plate_consultations')
      .select(
        `
        id,
        user_id,
        plate,
        status,
        payment_status,
        auto_refund_attempted,
        lookup_error_message,
        vehicle_data
      `,
      )
      .eq('id', consultationId)
      .maybeSingle(),
    getVehicleConsultationPrice(),
    getSiteSettings(),
  ]);

  if (consultationError || !consultation) {
    notFound();
  }

  // 2. Authorization validation:
  // - Owner is permitted
  // - Admins are permitted (to support, inspect, and test)
  // - Local development mode allows cross-user testing for developer convenience
  const isOwner = consultation.user_id === user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isOwner && !isDev) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminProfile) {
      notFound();
    }
  }

  const publicKey = getMercadoPagoPublicKey() || '';

  const preference = {
    consultationId: consultation.id,
    plate: consultation.plate,
    amount: price,
    publicKey,
    payerEmail: user.email || '',
    payerName: user.user_metadata?.full_name || '',
  };

  return (
    <div className="py-4 sm:py-10 px-3 sm:px-6 lg:px-8">
      <CustomerPaymentFlow
        preference={preference}
        initialConsultation={consultation}
        supportPhone={settings?.whatsapp_phone || null}
        allowDevSimulation={isDevPaymentSimulationEnabled()}
      />
    </div>
  );
}
