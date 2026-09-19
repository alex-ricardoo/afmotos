import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerConsultationWithDto } from '@/lib/customer/queries';
import { CustomerVehicleDetail } from '@/components/customer/customer-vehicle-detail';

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Laudo da Consulta | Área do Cliente | AF Veículos PE',
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

  return (
    <CustomerVehicleDetail
      consultation={result.consultation}
      dto={result.dto}
    />
  );
}
