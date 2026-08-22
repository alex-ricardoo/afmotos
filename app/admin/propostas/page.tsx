import { getLeads } from '@/lib/actions/leads';
import { DataTable } from '@/components/admin/data-table';
import { columns } from './columns';

export const metadata = {
  title: 'Gerenciar Propostas e Leads | AF Motos Admin',
};

export default async function AdminPropostasPage() {
  const data = await getLeads();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Propostas & Leads</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
