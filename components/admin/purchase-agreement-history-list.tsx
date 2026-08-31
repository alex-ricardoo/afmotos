'use client';

import React from 'react';
import { MotorcyclePurchaseAgreementRecord } from '@/types/purchase-agreement';
import { formatCurrencyBRL } from '@/lib/purchase-agreements/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseAgreementHistoryListProps {
  agreements: MotorcyclePurchaseAgreementRecord[];
}

export function PurchaseAgreementHistoryList({ agreements }: PurchaseAgreementHistoryListProps) {
  if (!agreements.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
        Nenhum contrato de compra emitido para este registro.
      </div>
    );
  }

  const handleOpenPdf = async (agreementId: string) => {
    try {
      const res = await fetch(`/api/admin/purchase-agreements/${agreementId}/pdf`);
      const data = await res.json();
      if (data.success && data.pdf_url) {
        window.open(data.pdf_url, '_blank');
      } else {
        toast.error(data.error || 'Não foi possível carregar o documento.');
      }
    } catch {
      toast.error('Erro de conexão ao carregar documento.');
    }
  };

  return (
    <div className="space-y-3">
      {agreements.map((agreement) => (
        <div
          key={agreement.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-zinc-100">{agreement.agreement_number}</span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]"
                >
                  {agreement.payment_status === 'PAID_FULL' ? 'Quitado' : agreement.payment_status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(agreement.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span>•</span>
                <span className="font-semibold text-zinc-300">
                  {formatCurrencyBRL(agreement.purchase_amount)}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenPdf(agreement.id)}
            className="border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 hover:text-white text-xs gap-1.5 h-8"
          >
            <Download className="size-3.5 text-amber-400" />
            Baixar PDF
          </Button>
        </div>
      ))}
    </div>
  );
}
