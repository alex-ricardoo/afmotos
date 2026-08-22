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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Propostas e Leads</h1>
          <p className="text-muted-foreground">Gerencie contatos e oportunidades comerciais</p>
        </div>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm border border-border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
