import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewConsultationForm } from '@/components/customer/new-consultation-form';

export const metadata = {
  title: 'Nova Consulta Veicular | Área do Cliente | AF Motos',
  description: 'Digite a placa do veículo para consultar histórico, leilão, multas, débitos e restrições.',
};

export default async function NovaConsultaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/consultas/nova');
  }

  return <NewConsultationForm />;
}
