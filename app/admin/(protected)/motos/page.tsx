import { getAdminMotorcycles } from '@/lib/queries/motorcycles';
import { DataTable } from '@/components/admin/data-table';
import { columns } from './columns';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Gerenciar Motos | AF Motos Admin',
};

export default async function AdminMotosPage(props: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const data = await getAdminMotorcycles(searchParams.status, searchParams.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Estoque de Motos</h1>
        <Link href="/admin/motos/nova" className={buttonVariants({ className: 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto' })}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Moto
        </Link>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
