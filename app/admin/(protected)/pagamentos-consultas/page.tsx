import { Suspense } from 'react';
import { Metadata } from 'next';
import { requireAdminUser } from '@/lib/auth/admin-guard';
import { getAdminPaymentSummary, getAdminPaymentsList } from '@/lib/admin/payments-service';
import { PaymentsDashboardClient } from '@/components/admin/payments/payments-dashboard-client';
import LoadingAdminPaymentsPage from './loading';

export const metadata: Metadata = {
  title: 'Central de Pagamentos, Consultas & Estornos',
  description:
    'Acompanhamento e gestão operacional de pagamentos Mercado Pago Checkout Pro, laudos veiculares, alertas de saldo da API Brasil e estornos auditados.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    deliveryStatus?: string;
    refundStatus?: string;
    insufficientCreditsOnly?: string;
    approvedWithoutReportOnly?: string;
    pendingRefundsOnly?: string;
  }>;
}

export default async function AdminPaymentsConsultationsPage({ searchParams }: PageProps) {
  // 1. Validação estrita de sessão e privilégios administrativos
  await requireAdminUser();

  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(resolvedParams.pageSize || '20', 10)));

  // 2. SSR: Carregamento inicial concorrente
  const [summary, listResult] = await Promise.all([
    getAdminPaymentSummary(),
    getAdminPaymentsList({
      page,
      pageSize,
      search: resolvedParams.search,
      status: resolvedParams.status,
      deliveryStatus: resolvedParams.deliveryStatus,
      refundStatus: resolvedParams.refundStatus,
      insufficientCreditsOnly: resolvedParams.insufficientCreditsOnly === 'true',
      approvedWithoutReportOnly: resolvedParams.approvedWithoutReportOnly === 'true',
      pendingRefundsOnly: resolvedParams.pendingRefundsOnly === 'true',
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pagamentos, Consultas & Estornos
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
              Operacional
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhamento em tempo real de pagamentos Mercado Pago, entrega de laudos veiculares,
            alertas de crédito e estornos seguros.
          </p>
        </div>
      </div>

      {/* Conteúdo Interativo com Suspense */}
      <Suspense fallback={<LoadingAdminPaymentsPage />}>
        <PaymentsDashboardClient
          initialSummary={summary}
          initialItems={listResult.items}
          initialTotalItems={listResult.totalItems}
          initialPage={listResult.page}
          initialPageSize={listResult.pageSize}
        />
      </Suspense>
    </div>
  );
}
