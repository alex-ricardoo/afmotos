import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerConsultationWithDto } from '@/lib/customer/queries';
import { CustomerVehicleDetail } from '@/components/customer/customer-vehicle-detail';
import { AutoRefundNotice } from '@/components/customer/auto-refund-notice';
import { getSiteSettings } from '@/lib/queries/settings';

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Laudo da Consulta | Área do Cliente | AF Motos',
  description: 'Detalhes e laudo completo da consulta veicular realizada.',
};

export default async function CustomerConsultationDetailPage({
  params,
}: ConsultationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/cliente/login?returnUrl=/cliente/consultas/${id}`);
  }

  const result = await getCustomerConsultationWithDto(id);

  if (!result || !result.consultation) {
    notFound();
  }

  // If auto-refund occurred due to provider outage
  if (
    result.consultation.auto_refund_attempted ||
    result.consultation.payment_status === 'refunded'
  ) {
    const settings = await getSiteSettings();
    return (
      <div className="py-6 sm:py-10">
        <AutoRefundNotice
          plate={result.consultation.plate}
          consultationId={result.consultation.id}
          errorMessage={result.consultation.lookup_error_message}
          supportPhone={settings?.whatsapp_phone || null}
        />
      </div>
    );
  }

  return (
    <CustomerVehicleDetail
      consultation={result.consultation}
      dto={result.dto}
    />
  );
}
