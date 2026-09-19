import { redirect } from 'next/navigation';

interface SalePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminSaleDetailsPage({ params }: SalePageProps) {
  const { id } = await params;
  redirect(`/admin/vendas/${id}/recibo`);
}
