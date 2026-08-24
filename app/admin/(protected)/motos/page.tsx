import { getAdminMotorcycles } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { AdminMotorcycleStock } from '@/components/admin/admin-motorcycle-stock';

export const metadata = {
  title: 'Estoque de Motos',
};

export default async function AdminMotosPage(props: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [data, settings] = await Promise.all([
    getAdminMotorcycles(searchParams.status, searchParams.search),
    getSettings(),
  ]);

  return <AdminMotorcycleStock initialData={data} siteName={settings?.site_name} />;
}
