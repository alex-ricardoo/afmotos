import { redirect } from 'next/navigation';

interface MotorcyclePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminMotorcycleDetailsPage({ params }: MotorcyclePageProps) {
  const { id } = await params;
  redirect(`/admin/motos/${id}/editar`);
}
