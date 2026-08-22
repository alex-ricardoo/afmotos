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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Estoque de Motos</h1>
        <Link href="/admin/motos/nova" className={buttonVariants({ className: 'bg-[#c9a44c] hover:bg-[#b8943c] text-black font-semibold' })}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Moto
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
