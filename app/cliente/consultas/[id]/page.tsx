import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConsultationDetail } from '@/lib/customer/queries';
import { ConsultationDetails } from '@/components/customer/consultation-details';

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

  const consultation = await getConsultationDetail(id);

  if (!consultation) {
    notFound();
  }

  return <ConsultationDetails consultation={consultation} />;
}
