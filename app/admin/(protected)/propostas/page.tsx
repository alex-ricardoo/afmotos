import { getLeads } from '@/lib/actions/leads';
import { AdminPropostasContacts } from '@/components/admin/admin-propostas-contacts';

export const metadata = {
  title: 'Contatos & Propostas | AF Motos Admin',
};

export default async function AdminPropostasPage() {
  const data = await getLeads();

  return <AdminPropostasContacts initialData={data || []} />;
}
