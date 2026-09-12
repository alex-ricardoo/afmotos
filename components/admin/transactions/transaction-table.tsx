'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionDetailDialog } from './transaction-detail-dialog';
import { getTransactionDetail } from '@/lib/admin/transaction-queries';
import { retryPaymentRefundAction } from '@/lib/admin/transaction-actions';
import { toast } from 'sonner';

interface TransactionTableProps {
  initialData: {
    transactions: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    summary: {
      totalRevenue: number;
      approvedCount: number;
      pendingCount: number;
      refundedCount: number;
      failedRefundsCount: number;
    };
  };
}

export function TransactionTable({ initialData }: TransactionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedRefund, setSelectedRefund] = useState(searchParams.get('refundStatus') || 'all');

  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedRefund !== 'all') params.set('refundStatus', selectedRefund);

    router.push(`/admin/transacoes-consultas?${params.toString()}`);
  };

  const handleOpenDetail = async (txId: string) => {
    startTransition(async () => {
      try {
        const detail = await getTransactionDetail(txId);
        if (detail) {
          setSelectedDetail(detail);
          setIsDetailOpen(true);
        } else {
          toast.error('Detalhes da transação não encontrados.');
        }
      } catch (err: any) {
        toast.error('Erro ao buscar detalhes da transação.');
      }
    });
  };

  const handleQuickRetryRefund = (txId: string) => {
    startTransition(async () => {
      try {
        const res = await retryPaymentRefundAction(txId, 'Retentativa rápida via tabela');
        if (res.success) {
          toast.success('Estorno processado com sucesso!');
          router.refresh();
        } else {
          toast.error(res.error || 'Falha ao estornar.');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao processar estorno.');
      }
    });
  };

  const { transactions, totalCount, totalPages, currentPage, summary } = initialData;

  return (
    <div className="space-y-6">
      {/* 1. Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Receita Aprovada</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {summary.totalRevenue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> {summary.approvedCount} pagamentos aprovados
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pendentes</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{summary.pendingCount}</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Aguardando Pix ou boleto</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Estornos Concluídos</span>
            <RotateCcw className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{summary.refundedCount}</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Devolvidos com sucesso</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Falhas de Estorno</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <p className={`text-2xl font-black ${summary.failedRefundsCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
            {summary.failedRefundsCount}
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Requerem ação manual</span>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por placa, e-mail ou ID Mercado Pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters(1)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="rejected">Rejeitado</option>
            <option value="refunded">Estornado</option>
          </select>

          <select
            value={selectedRefund}
            onChange={(e) => {
              setSelectedRefund(e.target.value);
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Todos Estornos</option>
            <option value="none">Sem Estorno</option>
            <option value="refunded">Estornado</option>
            <option value="failed">Falha de Estorno</option>
          </select>

          <Button
            size="sm"
            onClick={() => updateFilters(1)}
            className="bg-amber-600 hover:bg-amber-500 text-xs font-semibold"
          >
            Filtrar
          </Button>
        </div>
      </div>

      {/* 3. Transactions Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Cliente / Pagador</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Status MP</th>
              <th className="px-4 py-3">Estorno</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Nenhuma transação encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {tx.plate}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-200 block truncate max-w-[180px]">
                      {tx.payerEmail || '---'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      MP: {tx.mpPaymentId || '---'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-400">
                    {tx.transactionAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="px-4 py-3 uppercase text-zinc-400 font-mono text-[11px]">
                    {tx.paymentMethodId || '---'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        tx.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.status === 'pending' || tx.status === 'in_process'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        tx.refundStatus === 'refunded'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : tx.refundStatus === 'failed'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'text-zinc-500'
                      }`}
                    >
                      {tx.refundStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDetail(tx.id)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
                        title="Ver detalhes e timeline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {tx.refundStatus === 'failed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleQuickRetryRefund(tx.id)}
                          className="h-7 px-2 text-[10px]"
                          title="Retentar estorno"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Estornar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
          <span>
            Mostrando página {currentPage} de {totalPages} ({totalCount} transações no total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateFilters(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="h-8 text-xs border-zinc-700 bg-zinc-900"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Anterior
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => updateFilters(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="h-8 text-xs border-zinc-700 bg-zinc-900"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <TransactionDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        detail={selectedDetail}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
