import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerDashboardData } from '@/lib/customer/queries';
import { getUserCreditBalance } from '@/lib/credits/credit-service';
import { ClientDashboard } from '@/components/customer/client-dashboard';

export const metadata = {
  title: 'Dashboard | Área do Cliente | AF Motos',
  description: 'Acompanhe suas consultas veiculares e gerencie sua conta na AF Motos.',
};

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login');
  }

  const [dashboardData, creditBalance] = await Promise.all([
    getCustomerDashboardData(),
    getUserCreditBalance(user.id),
  ]);

  if (!dashboardData) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Não foi possível carregar as informações da sua conta.
      </div>
    );
  }

  return <ClientDashboard data={dashboardData} creditBalance={creditBalance} />;
}
