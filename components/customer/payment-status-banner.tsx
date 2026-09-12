'use client';

import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentStatusBannerProps {
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'refunded';
  statusDetail?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PaymentStatusBanner({
  status,
  statusDetail,
  onRefresh,
  isRefreshing = false,
}: PaymentStatusBannerProps) {
  if (status === 'approved') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-white">Pagamento Aprovado!</p>
          <p className="text-xs text-emerald-300/80">
            Sua consulta está sendo gerada e estará disponível em instantes.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-white">Aguardando Confirmação do Pagamento</p>
            <p className="text-xs text-amber-305/80">
              Assim que o Mercado Pago confirmar o recebimento, o laudo será processado automaticamente.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            type="button"
            className="inline-flex items-center gap-1.5 self-end sm:self-auto rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Consultando...' : 'Atualizar'}
          </button>
        )}
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-white">Pagamento Recusado</p>
          <p className="text-xs text-red-300/80">
            {statusDetail || 'A operadora recusou a transação. Por favor, tente com outro cartão ou via Pix.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
