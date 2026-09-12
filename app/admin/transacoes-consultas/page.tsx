import { requireAdminUser } from '@/lib/auth/admin-guard';
import { getAdminPaymentTransactions } from '@/lib/admin/transaction-queries';
import { TransactionTable } from '@/components/admin/transactions/transaction-table';
import { CreditCard, ShieldCheck } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    refundStatus?: string;
  }>;
}

export const metadata = {
  title: 'Transações de Consultas | Administração AF Motos',
  description: 'Auditoria, monitoramento e reconciliação de pagamentos Mercado Pago.',
};

export default async function AdminTransacoesConsultasPage({ searchParams }: PageProps) {
  await requireAdminUser();

  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = resolvedParams.pageSize ? parseInt(resolvedParams.pageSize, 10) : 20;
  const search = resolvedParams.search;
  const status = resolvedParams.status;
  const refundStatus = resolvedParams.refundStatus;

  const data = await getAdminPaymentTransactions({
    page,
    pageSize,
    search,
    status,
    refundStatus,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <CreditCard className="h-4 w-4" />
            <span>Financeiro & Gateway</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Transações de Consultas Veiculares
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Histórico completo de pagamentos Mercado Pago, estornos automáticos e auditoria de laudos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Mercado Pago SDK v2</span>
        </div>
      </div>

      {/* Main Table */}
      <TransactionTable initialData={data} />
    </div>
  );
}
