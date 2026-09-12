import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getConsultationHistory } from '@/lib/customer/queries';
import { ConsultationHistory } from '@/components/customer/consultation-history';

interface ConsultasPageProps {
  searchParams: Promise<{
    page?: string;
    placa?: string;
  }>;
}

export const metadata = {
  title: 'Minhas Consultas | Área do Cliente | AF Motos',
  description: 'Histórico de laudos e consultas de veículos realizadas na AF Motos.',
};

export default async function CustomerConsultasPage({ searchParams }: ConsultasPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const plateFilter = resolvedParams.placa || undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/consultas');
  }

  const historyData = await getConsultationHistory(page, plateFilter);

  return (
    <ConsultationHistory
      data={historyData}
      initialPlateFilter={plateFilter || ''}
    />
  );
}
