import { getAdminMotorcycles } from '@/lib/queries/motorcycles';
import { AdminMotorcycleStock } from '@/components/admin/admin-motorcycle-stock';

export const metadata = {
  title: 'Estoque de Motos | AF Motos Admin',
};

export default async function AdminMotosPage(props: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const data = await getAdminMotorcycles(searchParams.status, searchParams.search);

  return <AdminMotorcycleStock initialData={data} />;
}
