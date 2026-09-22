'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { type AdminPaymentItemDTO, type AdminPaymentSummary } from '@/lib/admin/payments-service';
import { PaymentsKpiCards } from './payments-kpi-cards';
import { PaymentsFiltersBar, type FilterState } from './payments-filters-bar';
import { PaymentsTable } from './payments-table';
import { InsufficientCreditsBanner } from './insufficient-credits-banner';
import { PaymentDetailDrawer } from './payment-detail-drawer';
import { RefundConfirmationModal } from './refund-confirmation-modal';
import { ReprocessConfirmationModal } from './reprocess-confirmation-modal';
import { RefreshCw } from 'lucide-react';

interface PaymentsDashboardClientProps {
  initialSummary: AdminPaymentSummary;
  initialItems: AdminPaymentItemDTO[];
  initialTotalItems: number;
  initialPage: number;
  initialPageSize: number;
}

export function PaymentsDashboardClient({
  initialSummary,
  initialItems,
  initialTotalItems,
  initialPage,
  initialPageSize,
}: PaymentsDashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [summary, setSummary] = useState<AdminPaymentSummary>(initialSummary);
  const [items, setItems] = useState<AdminPaymentItemDTO[]>(initialItems);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos filtros
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    purpose: searchParams.get('purpose') || '',
    status: searchParams.get('status') || '',
    deliveryStatus: searchParams.get('deliveryStatus') || '',
    refundStatus: searchParams.get('refundStatus') || '',
    insufficientCreditsOnly: searchParams.get('insufficientCreditsOnly') === 'true',
    approvedWithoutReportOnly: searchParams.get('approvedWithoutReportOnly') === 'true',
    pendingRefundsOnly: searchParams.get('pendingRefundsOnly') === 'true',
  });

  // Modais e Gaveta
  const [selectedDetailItem, setSelectedDetailItem] = useState<AdminPaymentItemDTO | null>(null);
  const [selectedRefundItem, setSelectedRefundItem] = useState<AdminPaymentItemDTO | null>(null);
  const [selectedReprocessItem, setSelectedReprocessItem] = useState<AdminPaymentItemDTO | null>(
    null,
  );
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [isSubmittingReprocess, setIsSubmittingReprocess] = useState(false);

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Carrega dados da API com os filtros atuais
  const fetchData = useCallback(
    async (currentPage: number, currentFilters: FilterState) => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams();
        query.set('page', String(currentPage));
        query.set('pageSize', String(pageSize));

        if (currentFilters.search) query.set('search', currentFilters.search);
        if (currentFilters.purpose) query.set('purpose', currentFilters.purpose);
        if (currentFilters.status) query.set('status', currentFilters.status);
        if (currentFilters.deliveryStatus)
          query.set('deliveryStatus', currentFilters.deliveryStatus);
        if (currentFilters.refundStatus) query.set('refundStatus', currentFilters.refundStatus);
        if (currentFilters.insufficientCreditsOnly) query.set('insufficientCreditsOnly', 'true');
        if (currentFilters.approvedWithoutReportOnly)
          query.set('approvedWithoutReportOnly', 'true');
        if (currentFilters.pendingRefundsOnly) query.set('pendingRefundsOnly', 'true');

        const res = await fetch(`/api/admin/payments?${query.toString()}`);
        const data = await res.json();

        if (data.success) {
          setSummary(data.summary);
          setItems(data.items);
          setTotalItems(data.pagination.totalItems);
          setPage(data.pagination.page);

          // Sincroniza query params da URL de forma limpa
          startTransition(() => {
            const newUrl = query.toString() ? `${pathname}?${query.toString()}` : pathname;
            router.replace(newUrl, { scroll: false });
          });
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        showFeedback('Erro de conexão ao carregar transações.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [pathname, pageSize, router],
  );

  // Atualiza os filtros e recarrega a página 1
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setPage(1);
    fetchData(1, updated);
  };

  const handleResetFilters = () => {
    const empty: FilterState = {
      search: '',
      purpose: '',
      status: '',
      deliveryStatus: '',
      refundStatus: '',
      insufficientCreditsOnly: false,
      approvedWithoutReportOnly: false,
      pendingRefundsOnly: false,
    };
    setFilters(empty);
    setPage(1);
    fetchData(1, empty);
  };

  // Clique nos Cards de KPI para filtrar
  const handleSelectKpiFilter = (filterKey: string | null) => {
    if (!filterKey) {
      handleResetFilters();
      return;
    }

    if (filterKey === 'status:approved') {
      handleFilterChange({
        status: 'approved',
        deliveryStatus: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'delivery:completed') {
      handleFilterChange({
        deliveryStatus: 'completed',
        status: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'delivery:processing') {
      handleFilterChange({
        deliveryStatus: 'processing',
        status: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'delivery:retry_scheduled') {
      handleFilterChange({
        deliveryStatus: 'retry_scheduled',
        status: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'delivery:failed_permanent') {
      handleFilterChange({
        deliveryStatus: 'failed_permanent',
        status: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'insufficient_credits') {
      handleFilterChange({
        insufficientCreditsOnly: true,
        status: '',
        deliveryStatus: '',
        refundStatus: '',
      });
    } else if (filterKey === 'refund:pending') {
      handleFilterChange({
        refundStatus: 'pending',
        status: '',
        deliveryStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'purpose:credit_package') {
      handleFilterChange({
        purpose: 'credit_package',
        status: '',
        deliveryStatus: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'purpose:vehicle_consultation') {
      handleFilterChange({
        purpose: 'vehicle_consultation',
        status: '',
        deliveryStatus: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'packages:pending_grant') {
      handleFilterChange({
        purpose: 'credit_package',
        status: 'approved',
        deliveryStatus: '',
        refundStatus: '',
        insufficientCreditsOnly: false,
      });
    } else if (filterKey === 'refund:confirmed') {
      handleFilterChange({
        refundStatus: 'confirmed',
        status: '',
        deliveryStatus: '',
        insufficientCreditsOnly: false,
      });
    }
  };

  // Execução de Estorno
  const handleConfirmRefund = async (params: {
    transactionId: string;
    reasonCode: string;
    adminNote?: string;
    confirmationText: string;
  }) => {
    setIsSubmittingRefund(true);
    try {
      const isPackage =
        selectedRefundItem?.purpose === 'credit_package' &&
        selectedRefundItem?.creditPackageOrderId;

      const endpoint = isPackage
        ? `/api/admin/credit-package-orders/${selectedRefundItem.creditPackageOrderId}/refund`
        : `/api/admin/payments/${params.transactionId}/refund`;

      const body = isPackage
        ? JSON.stringify({
            reason: params.adminNote || params.reasonCode,
          })
        : JSON.stringify(params);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Falha ao processar estorno.');
      }

      showFeedback(result.message || 'Estorno processado com sucesso!');
      fetchData(page, filters);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Execução de Reprocessamento
  const handleConfirmReprocess = async (params: {
    transactionId: string;
    confirmProviderFunded: boolean;
    adminNote?: string;
  }) => {
    setIsSubmittingReprocess(true);
    try {
      const res = await fetch(`/api/admin/payments/${params.transactionId}/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Falha ao reprocessar consulta.');
      }

      showFeedback(result.message || 'Reprocessamento iniciado com sucesso!');
      fetchData(page, filters);
    } finally {
      setIsSubmittingReprocess(false);
    }
  };

  // Reconciliação
  const handleReconcile = async (item: AdminPaymentItemDTO) => {
    setReconcilingId(item.transactionId);
    try {
      const endpoint =
        item.purpose === 'credit_package' && item.creditPackageOrderId
          ? `/api/admin/credit-package-orders/${item.creditPackageOrderId}/reconcile`
          : `/api/admin/payments/${item.transactionId}/refund/reconcile`;

      const res = await fetch(endpoint, {
        method: 'POST',
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Falha na reconciliação.');
      }

      showFeedback(result.message || 'Reconciliação concluída.');
      fetchData(page, filters);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar com Mercado Pago.';
      showFeedback(msg, 'error');
    } finally {
      setReconcilingId(null);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl border transition-all animate-in slide-in-from-bottom-5 ${
            feedback.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Barra de Status e Ações Rápidas */}
      <div className="flex items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-zinc-300">
            Painel Conectado ao Mercado Pago & API Brasil
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchData(page, filters);
            showFeedback('Dados atualizados com sucesso.');
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-98"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#c9a44c] ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Sincronizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {/* Banner de Saldo Insuficiente na API Brasil */}
      <InsufficientCreditsBanner
        count={summary.totalInsufficientCredits}
        isFiltered={filters.insufficientCreditsOnly}
        onFilterClick={() =>
          handleFilterChange({
            insufficientCreditsOnly: !filters.insufficientCreditsOnly,
          })
        }
      />

      {/* Cards de KPIs */}
      <PaymentsKpiCards
        summary={summary}
        activeFilter={
          filters.insufficientCreditsOnly
            ? 'insufficient_credits'
            : filters.status
              ? `status:${filters.status}`
              : filters.deliveryStatus
                ? `delivery:${filters.deliveryStatus}`
                : filters.refundStatus
                  ? `refund:${filters.refundStatus}`
                  : null
        }
        onSelectFilter={handleSelectKpiFilter}
      />

      {/* Barra de Filtros e Busca */}
      <PaymentsFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Tabela de Transações */}
      <PaymentsTable
        items={items}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(newPage) => {
          setPage(newPage);
          fetchData(newPage, filters);
        }}
        onOpenDetails={setSelectedDetailItem}
        onOpenRefund={setSelectedRefundItem}
        onOpenReprocess={setSelectedReprocessItem}
        onReconcile={handleReconcile}
        reconcilingId={reconcilingId}
      />

      {/* Gaveta de Detalhes e Auditoria */}
      <PaymentDetailDrawer
        isOpen={Boolean(selectedDetailItem)}
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onOpenRefund={(it) => {
          setSelectedDetailItem(null);
          setSelectedRefundItem(it);
        }}
        onOpenReprocess={(it) => {
          setSelectedDetailItem(null);
          setSelectedReprocessItem(it);
        }}
        onReconcile={(it) => handleReconcile(it)}
        isReconciling={reconcilingId === selectedDetailItem?.transactionId}
      />

      {/* Modal de Confirmação Reforçada de Estorno */}
      <RefundConfirmationModal
        isOpen={Boolean(selectedRefundItem)}
        item={selectedRefundItem}
        onClose={() => setSelectedRefundItem(null)}
        onConfirmRefund={handleConfirmRefund}
        isSubmitting={isSubmittingRefund}
      />

      {/* Modal de Reprocessamento */}
      <ReprocessConfirmationModal
        isOpen={Boolean(selectedReprocessItem)}
        item={selectedReprocessItem}
        onClose={() => setSelectedReprocessItem(null)}
        onConfirmReprocess={handleConfirmReprocess}
        isSubmitting={isSubmittingReprocess}
      />
    </div>
  );
}
