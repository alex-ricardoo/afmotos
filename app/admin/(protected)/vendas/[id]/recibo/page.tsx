import React from 'react';
import { notFound } from 'next/navigation';
import { getSaleById } from '@/lib/queries/sales';
import { getSiteSettings } from '@/lib/queries/settings';
import { OfficialReceiptPrint } from '@/components/admin/sales/official-receipt-print';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminSaleReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  const [sale, settings] = await Promise.all([
    getSaleById(id),
    getSiteSettings(),
  ]);

  if (!sale) {
    notFound();
  }

  return <OfficialReceiptPrint sale={sale} siteSettings={settings} />;
}
