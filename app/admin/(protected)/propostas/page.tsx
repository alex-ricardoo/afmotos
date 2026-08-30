import { Suspense } from 'react';
import { getLeads } from '@/lib/actions/leads';
import { getSettings } from '@/lib/actions/settings';
import { AdminPropostasContacts } from '@/components/admin/admin-propostas-contacts';

export const metadata = {
  title: 'Contatos & Propostas',
};

export default async function AdminPropostasPage() {
  const [data, settings] = await Promise.all([getLeads(), getSettings()]);

  return (
    <Suspense fallback={<div className="p-8 text-zinc-500 text-xs">Carregando propostas...</div>}>
      <AdminPropostasContacts initialData={data || []} siteName={settings?.site_name} />
    </Suspense>
  );
}
