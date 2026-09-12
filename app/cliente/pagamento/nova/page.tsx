import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { initiateConsultation } from '@/lib/customer/consultation-service';
import { isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface NovaConsultaPageProps {
  searchParams: Promise<{
    placa?: string;
  }>;
}

export const metadata = {
  title: 'Iniciando Consulta | Área do Cliente | AF Motos',
  description: 'Iniciando consulta veicular e preparando pagamento...',
};

export default async function NovaConsultaPage({ searchParams }: NovaConsultaPageProps) {
  const { placa } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const returnUrl = placa
    ? `/cliente/pagamento/nova?placa=${encodeURIComponent(placa)}`
    : '/cliente';

  if (!user) {
    redirect(`/cliente/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  if (!placa || !isValidBrazilianPlate(placa)) {
    redirect('/historico-veicular');
  }

  const res = await initiateConsultation(placa);

  if (res.error || !res.consultationId) {
    redirect('/cliente?error=' + encodeURIComponent(res.error || 'Erro ao iniciar consulta'));
  }

  redirect(`/cliente/pagamento/${res.consultationId}`);
}
