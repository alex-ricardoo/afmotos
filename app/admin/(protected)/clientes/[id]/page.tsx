import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCustomerById } from '@/lib/queries/customers';
import { CustomerDetailsHeader } from '@/components/admin/customers/customer-details-header';
import { CustomerSummaryCards } from '@/components/admin/customers/customer-summary-cards';
import { CustomerRelationsTabs } from '@/components/admin/customers/customer-relations-tabs';

import { getSettings } from '@/lib/actions/settings';
import { getSiteName } from '@/lib/site-settings';

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return {
    title: customer ? customer.full_name : 'Cliente não encontrado',
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, settings] = await Promise.all([
    getCustomerById(id),
    getSettings(),
  ]);

  if (!customer) {
    notFound();
  }

  const storeName = getSiteName(settings);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center justify-center h-7 px-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Voltar para Clientes
        </Link>
        <span className="text-zinc-600">/</span>
        <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-none">
          {customer.full_name}
        </span>
      </div>

      {/* 1. Header do Perfil */}
      <CustomerDetailsHeader customer={customer} storeName={storeName} />

      {/* 2. Cards de Resumo 360° */}
      <CustomerSummaryCards relationships={customer.relationships} />

      {/* 3. Abas de Relacionamentos & Histórico */}
      <CustomerRelationsTabs customer={customer} storeName={storeName} />
    </div>
  );
}
