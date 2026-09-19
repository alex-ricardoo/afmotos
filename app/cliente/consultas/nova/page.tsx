import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewConsultationForm } from '@/components/customer/new-consultation-form';

export const metadata = {
  title: 'Nova Consulta Veicular | Área do Cliente | AF Veículos PE',
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

  return (
    <Suspense fallback={<div className="text-center py-12 text-zinc-500 text-xs">Carregando formulário...</div>}>
      <NewConsultationForm />
    </Suspense>
  );
}
