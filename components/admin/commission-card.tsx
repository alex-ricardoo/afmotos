'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProposalViewModel } from '@/lib/admin/proposal-view-model';
import {
  ProposalCommissionRecord,
  CommissionType,
  CommissionStatus,
} from '@/types/commission';
import {
  getCommissionByProposalId,
  saveOrUpdateCommissionAction,
  receiveCommissionAction,
  cancelCommissionAction,
} from '@/lib/actions/commissions';
import {
  calculateCommission,
  getNetClientValue,
  getCommissionStatusLabel,
  getCommissionStatusBadgeVariant,
  getCommissionStatusBadgeClass,
} from '@/lib/domain/commission-rules';
import { formatCurrencyBRL } from '@/lib/reports/formatters';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Percent,
  CircleDollarSign,
  Calculator,
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Save,
  Clock,
  Sparkles,
  User,
  FileSignature,
  ExternalLink,
  Download,
  FileCheck,
  Edit3,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CommissionHistoryModal } from './commission-history-modal';

interface CommissionCardProps {
  proposal: ProposalViewModel;
  onCommissionChange?: (commission: ProposalCommissionRecord) => void;
  storeName?: string;
}

export function CommissionCard({
  proposal,
  onCommissionChange,
  storeName = 'AF Motos',
}: CommissionCardProps) {
  const [commission, setCommission] = useState<ProposalCommissionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAgreement, setIsGeneratingAgreement] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Controle de Visualização: Modo Edição vs Modo Visualização de Contrato Emitido
  const [isEditing, setIsEditing] = useState(false);
  const [showInlineReceiveForm, setShowInlineReceiveForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Form states de comissão
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage');
  const [percentage, setPercentage] = useState<number>(5);
  const [fixedValue, setFixedValue] = useState<number>(1000);
  const [expectedSaleValue, setExpectedSaleValue] = useState<number>(
    proposal.motorcycle?.desiredPrice ?? proposal.motorcycle?.fipePrice ?? 0,
  );
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Form states contratuais (dados do proprietário para formalização em PDF)
  const [cpf, setCpf] = useState<string>(
    typeof proposal.metadata?.owner_cpf === 'string' ? proposal.metadata.owner_cpf : '',
  );
  const [rg, setRg] = useState<string>(
    typeof proposal.metadata?.owner_rg === 'string' ? proposal.metadata.owner_rg : '',
  );
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null);

  // Form states de Baixa / Recebimento Inline
  const [receivedValue, setReceivedValue] = useState<number>(0);
  const [receivedAt, setReceivedAt] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [receiptReference, setReceiptReference] = useState<string>('');
  const [receiptNotes, setReceiptNotes] = useState<string>('');

  const loadCommission = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommissionByProposalId(proposal.id);
      if (res.success && res.commission) {
        const c = res.commission;
        setCommission(c);
        setCommissionType(c.commission_type);
        if (c.commission_percentage !== null) setPercentage(c.commission_percentage);
        if (c.commission_fixed_value !== null) setFixedValue(c.commission_fixed_value);
        if (c.expected_sale_value !== null && c.expected_sale_value > 0) {
          setExpectedSaleValue(c.expected_sale_value);
        }
        if (c.notes) setNotes(c.notes);

        if (res.agreementUrl) {
          setAgreementUrl(res.agreementUrl);
        }
        if (res.agreementOwnerData) {
          if (res.agreementOwnerData.owner_cpf && !cpf) setCpf(res.agreementOwnerData.owner_cpf);
          if (res.agreementOwnerData.owner_rg && !rg) setRg(res.agreementOwnerData.owner_rg);
        }
      } else {
        const defVal = proposal.motorcycle?.desiredPrice ?? proposal.motorcycle?.fipePrice ?? 0;
        setExpectedSaleValue(defVal);
      }
    } catch (err) {
      console.warn('Could not load commission for proposal:', err);
    } finally {
      setLoading(false);
    }
  }, [proposal.id, proposal.motorcycle?.desiredPrice, proposal.motorcycle?.fipePrice, cpf, rg]);

  useEffect(() => {
    loadCommission();
  }, [loadCommission]);

  // Atualizar valor inicial do formulário de recebimento
  useEffect(() => {
    if (commission) {
      setReceivedValue(
        commission.commission_confirmed_value ??
          commission.commission_expected_value ??
          calculateCommission(commissionType, percentage, fixedValue, expectedSaleValue),
      );
    }
  }, [commission, commissionType, percentage, fixedValue, expectedSaleValue]);

  // Máscaras de CPF e RG
  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setCpf(
      digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    );
  };

  const handleRgChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const masked = digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    setRg(masked);
  };

  // Cálculos dinâmicos
  const calculatedCommissionValue = calculateCommission(
    commissionType,
    percentage,
    fixedValue,
    expectedSaleValue,
  );
  const netClientValue = getNetClientValue(expectedSaleValue, calculatedCommissionValue);

  const formattedCpf = cpf.replace(/\D/g, '');
  const isAgreementDataValid =
    formattedCpf.length === 11 && rg.trim().length >= 2 && expectedSaleValue > 0;

  const currentStatus: CommissionStatus = commission?.status || 'draft';
  const hasGeneratedAgreement = Boolean(agreementUrl || commission?.sale_agreement_id);

  // Ação Única Unificada: Salva a comissão e gera o contrato PDF
  const handleSaveAndGenerate = async () => {
    setIsSaving(true);
    try {
      const targetSellRequestId =
        (proposal.metadata as Record<string, unknown> | null)?.sell_request_id ||
        (proposal.source === 'sell_request' ? proposal.sourceId : null);

      // 1. Salvar os dados financeiros da comissão
      const res = await saveOrUpdateCommissionAction({
        id: commission?.id,
        proposal_id: proposal.id,
        sell_request_id: (targetSellRequestId as string) || null,
        motorcycle_id: proposal.motorcycle?.id || null,
        commission_type: commissionType,
        commission_percentage: commissionType === 'percentage' ? Number(percentage) : null,
        commission_fixed_value: commissionType === 'fixed' ? Number(fixedValue) : null,
        expected_sale_value: Number(expectedSaleValue),
        status: commission ? commission.status : 'proposed',
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.commission) {
        throw new Error(res.error || 'Não foi possível salvar a comissão.');
      }

      setCommission(res.commission);
      setReason('');
      if (onCommissionChange) onCommissionChange(res.commission);

      // 2. Se CPF e RG foram preenchidos, gerar o contrato PDF imediatamente
      if (isAgreementDataValid) {
        setIsGeneratingAgreement(true);
        const agreementResponse = await fetch('/api/agreements/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sell_request_id: targetSellRequestId || proposal.sourceId || proposal.id,
            owner_cpf: formattedCpf,
            owner_rg: rg.trim(),
            commission_percentage:
              commissionType === 'percentage'
                ? Number(percentage)
                : Number(((calculatedCommissionValue / expectedSaleValue) * 100).toFixed(2)),
            expected_sale_value: Number(expectedSaleValue),
          }),
        });

        const payload = await agreementResponse.json();
        if (agreementResponse.ok && payload?.success) {
          setAgreementUrl(payload.pdf_url || null);
          setIsEditing(false); // Ocultar campos de digitação e exibir visão consolidada
          toast.success('Comissão salva e Contrato de Consignação gerado com sucesso!');
          await loadCommission();
          return;
        }
      }

      if (isAgreementDataValid) {
        setIsEditing(false);
        toast.success('Comissão salva com sucesso!');
      } else {
        toast.success('Comissão salva com sucesso! Preencha o CPF e RG para emitir o PDF do contrato.');
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao processar comissão e contrato.');
    } finally {
      setIsSaving(false);
      setIsGeneratingAgreement(false);
    }
  };

  // Download direto do arquivo PDF para o computador
  const handleDirectDownload = async () => {
    if (!agreementUrl) return;
    setIsDownloading(true);
    try {
      toast.info('Baixando contrato em PDF...');
      const response = await fetch(agreementUrl);
      if (!response.ok) throw new Error('Não foi possível carregar o arquivo PDF.');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const clientName = (proposal.name || 'cliente').toLowerCase().replace(/\s+/g, '-');
      const storeSlug = (storeName || 'loja').toLowerCase().replace(/\s+/g, '-');
      link.download = `contrato-consignacao-${storeSlug}-${clientName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download do PDF concluído!');
    } catch (err) {
      console.warn('Fallback direct download:', err);
      window.open(agreementUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Submissão do Formulário Inline de Baixa no Caixa
  const handleConfirmInlineReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;

    if (receivedValue <= 0) {
      toast.error('O valor recebido deve ser maior que zero.');
      return;
    }

    setIsReceiving(true);
    try {
      const res = await receiveCommissionAction({
        id: commission.id,
        received_value: Number(receivedValue),
        received_at: receivedAt,
        received_payment_method: paymentMethod.trim(),
        received_reference: receiptReference.trim() || null,
        notes: receiptNotes.trim() || null,
      });

      if (!res.success || !res.commission) {
        throw new Error(res.error || 'Falha ao registrar recebimento.');
      }

      setCommission(res.commission);
      setShowInlineReceiveForm(false);
      toast.success('Recebimento de comissão registrado com sucesso no caixa!');
      if (onCommissionChange) onCommissionChange(res.commission);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao registrar baixa de comissão.');
    } finally {
      setIsReceiving(false);
    }
  };

  // Cancelar comissão
  const handleCancelCommission = async () => {
    if (!commission?.id) return;
    if (!confirm('Deseja realmente cancelar esta comissão? Esta ação será registrada no histórico.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await cancelCommissionAction({
        id: commission.id,
        reason: 'Cancelado pelo administrador no painel de proposta.',
      });

      if (!res.success || !res.commission) {
        throw new Error(res.error || 'Falha ao cancelar comissão.');
      }

      setCommission(res.commission);
      toast.success('Comissão cancelada com sucesso.');
      if (onCommissionChange) onCommissionChange(res.commission);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao cancelar comissão.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-400 gap-2">
        <Loader2 className="size-5 animate-spin text-amber-400" />
        <span className="text-sm">Carregando dados da comissão e contrato...</span>
      </div>
    );
  }

  // =========================================================================
  // CASO 1: CONTRATO GERADO & NÃO ESTÁ EM MODO DE EDIÇÃO
  // Exibe visualização consolidada e limpa (sem formulários gigantes)
  // =========================================================================
  if (hasGeneratedAgreement && !isEditing) {
    return (
      <div className="space-y-4">
        {/* Cabeçalho de Status */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">Contrato de Consignação & Comissão</h4>
                <Badge className={getCommissionStatusBadgeClass(currentStatus)}>
                  {getCommissionStatusLabel(currentStatus)}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Contrato formal gerado e termos comerciais registrados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {commission?.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="h-8 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 gap-1.5 rounded-lg"
              >
                <History className="size-3.5" />
                Histórico
              </Button>
            )}
          </div>
        </div>

        {/* Resumo Financeiro Consolidado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-950/80 p-3.5 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Venda Prevista</span>
            <span className="mt-1 text-base font-black text-white font-mono block truncate">
              {formatCurrencyBRL(commission?.expected_sale_value ?? expectedSaleValue)}
            </span>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/25">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-400/90">
              <span>Comissão {storeName}</span>
              <span className="font-mono">
                {commission?.commission_type === 'percentage'
                  ? `${commission.commission_percentage}%`
                  : 'Fixo'}
              </span>
            </div>
            <span className="mt-1 text-base font-black text-amber-300 font-mono block truncate">
              {formatCurrencyBRL(
                commission?.commission_confirmed_value ??
                  commission?.commission_expected_value ??
                  calculatedCommissionValue,
              )}
            </span>
          </div>

          <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/25">
            <span className="text-[10px] uppercase font-bold text-emerald-400/90 block">
              Líquido do Proprietário
            </span>
            <span className="mt-1 text-base font-black text-emerald-300 font-mono block truncate">
              {formatCurrencyBRL(
                getNetClientValue(
                  commission?.expected_sale_value ?? expectedSaleValue,
                  commission?.commission_confirmed_value ??
                    commission?.commission_expected_value ??
                    calculatedCommissionValue,
                ),
              )}
            </span>
          </div>
        </div>

        {/* Card do Contrato Emitido e Pronto */}
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">
                  Instrumento Particular de Intermediação & Anúncio
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Proprietário: <span className="text-zinc-200 font-semibold">{proposal.name || 'Cliente'}</span>
                  {cpf ? ` • CPF: ${cpf}` : ''}
                  {rg ? ` • RG: ${rg}` : ''}
                </p>
              </div>
            </div>

            {agreementUrl && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={agreementUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: 'outline',
                    className:
                      'h-9 px-3.5 rounded-xl border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 font-bold gap-1.5 cursor-pointer',
                  })}
                >
                  <ExternalLink className="size-3.5" />
                  Visualizar Contrato
                </a>
                <Button
                  type="button"
                  onClick={handleDirectDownload}
                  disabled={isDownloading}
                  className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      Baixar PDF
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* FORMULÁRIO INLINE DE BAIXA NO CAIXA (Sem modal sobreposto!) */}
        {showInlineReceiveForm && (
          <form
            onSubmit={handleConfirmInlineReceipt}
            className="rounded-2xl bg-zinc-950 border border-emerald-500/40 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <h5 className="text-xs font-bold text-white">Baixa de Recebimento no Caixa {storeName}</h5>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowInlineReceiveForm(false)}
                className="h-7 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inline-received-val" className="text-xs text-zinc-300">
                  Valor Recebido (R$)
                </Label>
                <Input
                  id="inline-received-val"
                  type="number"
                  step={0.01}
                  min={0.01}
                  value={receivedValue}
                  onChange={(e) => setReceivedValue(Number(e.target.value || 0))}
                  className="h-9 bg-zinc-900 border-zinc-800 font-mono font-bold text-emerald-400 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inline-received-date" className="text-xs text-zinc-300">
                  Data de Recebimento
                </Label>
                <Input
                  id="inline-received-date"
                  type="date"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inline-payment-method" className="text-xs text-zinc-300">
                  Forma de Pagamento
                </Label>
                <select
                  id="inline-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="PIX">PIX</option>
                  <option value="TED">Transferência TED / DOC</option>
                  <option value="DINHEIRO">Dinheiro em Espécie</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="OUTRO">Outro Método</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inline-ref" className="text-xs text-zinc-300">
                  Comprovante / Código da Transação (Opcional)
                </Label>
                <Input
                  id="inline-ref"
                  placeholder="Ex.: PIX ID E2026083112345..."
                  value={receiptReference}
                  onChange={(e) => setReceiptReference(e.target.value)}
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inline-notes" className="text-xs text-zinc-300">
                  Observações (Opcional)
                </Label>
                <Input
                  id="inline-notes"
                  placeholder="Ex.: Pago integralmente na entrega das chaves"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="h-9 bg-zinc-900 border-zinc-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowInlineReceiveForm(false)}
                className="h-9 text-xs text-zinc-400 hover:text-white rounded-xl"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isReceiving}
                className="h-9 text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl gap-1.5 cursor-pointer"
              >
                {isReceiving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Confirmar Baixa no Caixa
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* BARRA DE AÇÕES PRINCIPAIS */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Ação 1: Registrar Recebimento */}
          {commission?.id && commission.status !== 'received' && commission.status !== 'cancelled' && (
            <Button
              type="button"
              onClick={() => setShowInlineReceiveForm(!showInlineReceiveForm)}
              className="h-11 flex-1 min-w-[180px] text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 className="size-4" />
              {showInlineReceiveForm ? 'Fechar Formulário de Baixa' : 'Baixar Recebimento'}
            </Button>
          )}

          {/* Ação 2: Editar Condições / Reabrir Campos */}
          {commission?.status !== 'received' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-11 text-xs border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl gap-1.5 cursor-pointer"
            >
              <Edit3 className="size-4 text-amber-400" />
              Editar Condições / Contrato
            </Button>
          )}

          {/* Ação 3: Cancelar */}
          {commission?.id && commission.status !== 'received' && commission.status !== 'cancelled' && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelCommission}
              disabled={isCancelling}
              className="h-11 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl cursor-pointer"
            >
              Cancelar Comissão
            </Button>
          )}
        </div>

        {/* Modal de Histórico */}
        {commission?.id && (
          <CommissionHistoryModal
            commissionId={commission.id}
            open={showHistory}
            onOpenChange={setShowHistory}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // CASO 2: MODO DE PREENCHIMENTO / EDIÇÃO
  // Exibe os inputs organizados e 1 único botão de Salvar e Gerar
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Header com Status e Histórico */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calculator className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white">
                {isEditing ? 'Editar Condições da Comissão e Contrato' : 'Definição de Comissão & Contrato'}
              </h4>
              <Badge className={getCommissionStatusBadgeClass(currentStatus)}>
                {getCommissionStatusLabel(currentStatus)}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing
                ? 'Altere os valores ou documentos do proprietário e regere o contrato.'
                : `Defina a comissão da ${storeName} e emita o contrato formal em PDF em um clique.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasGeneratedAgreement && isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancelar Edição
            </Button>
          )}
          {commission?.id && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="h-8 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 gap-1.5 rounded-lg"
            >
              <History className="size-3.5" />
              Histórico
            </Button>
          )}
        </div>
      </div>

      {/* 1. SEÇÃO FINANCEIRA: Modalidade e Valores */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Modalidade */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Modalidade de Comissão</Label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setCommissionType('percentage')}
                className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'percentage'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Percentual (%)
              </button>
              <button
                type="button"
                onClick={() => setCommissionType('fixed')}
                className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  commissionType === 'fixed'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Valor Fixo (R$)
              </button>
            </div>
          </div>

          {/* Input do Valor da Comissão */}
          <div className="space-y-1.5">
            <Label htmlFor="commission-val" className="flex items-center gap-1.5 text-xs text-zinc-300">
              {commissionType === 'percentage' ? (
                <>
                  <Percent className="size-3.5 text-amber-400" />
                  Percentual de Comissão
                </>
              ) : (
                <>
                  <CircleDollarSign className="size-3.5 text-amber-400" />
                  Valor Fixo de Comissão
                </>
              )}
            </Label>
            <div className="relative">
              {commissionType === 'percentage' ? (
                <>
                  <Input
                    id="commission-val"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value.replace(/^0+(?=\d)/, '') || 0))}
                    className="h-10 pr-9 bg-zinc-950/70 border-zinc-800 font-mono font-bold text-amber-300 focus:border-amber-500/50 rounded-xl"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-zinc-500">
                    %
                  </span>
                </>
              ) : (
                <>
                  <Input
                    id="commission-val"
                    type="number"
                    min={0}
                    step={10}
                    value={fixedValue}
                    onChange={(e) => setFixedValue(Number(e.target.value.replace(/^0+(?=\d)/, '') || 0))}
                    className="h-10 pr-10 bg-zinc-950/70 border-zinc-800 font-mono font-bold text-amber-300 focus:border-amber-500/50 rounded-xl"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-zinc-500">
                    R$
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Valor Esperado de Venda */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="expected-val" className="flex items-center gap-1.5 text-xs text-zinc-300">
                <CircleDollarSign className="size-3.5 text-emerald-400" />
                Valor Esperado de Venda / Anúncio (R$)
              </Label>
              {proposal.motorcycle?.desiredPrice && (
                <span className="text-[11px] text-zinc-500">
                  Expectativa cliente: {formatCurrencyBRL(proposal.motorcycle.desiredPrice)}
                </span>
              )}
            </div>
            <Input
              id="expected-val"
              type="number"
              min={0}
              step={100}
              value={expectedSaleValue}
              onChange={(e) => setExpectedSaleValue(Number(e.target.value || 0))}
              className="h-10 bg-zinc-950/70 border-zinc-800 font-mono font-bold text-emerald-400 focus:border-emerald-500/50 rounded-xl"
            />
          </div>

          {/* Motivo da Alteração (Exibido quando editando) */}
          {commission?.id && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-reason" className="text-xs text-zinc-400">
                Motivo da Alteração (Obrigatório para registrar no histórico)
              </Label>
              <Input
                id="edit-reason"
                placeholder="Ex.: Renegociação de margem / desconto concedido pelo vendedor"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 bg-zinc-900/80 border-zinc-800 text-xs focus:border-zinc-700 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Resumo Financeiro Consolidado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Venda Prevista</span>
            <span className="mt-0.5 text-base font-black text-white font-mono block truncate">
              {formatCurrencyBRL(expectedSaleValue)}
            </span>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/25">
            <span className="text-[10px] uppercase font-bold text-amber-400/90 block">Comissão {storeName}</span>
            <span className="mt-0.5 text-base font-black text-amber-300 font-mono block truncate">
              {formatCurrencyBRL(calculatedCommissionValue)}
            </span>
          </div>

          <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/25">
            <span className="text-[10px] uppercase font-bold text-emerald-400/90 block">Líquido do Proprietário</span>
            <span className="mt-0.5 text-base font-black text-emerald-300 font-mono block truncate">
              {formatCurrencyBRL(netClientValue)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO CONTRATUAL: Documentos do Proprietário para Gerar PDF */}
      <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileSignature className="size-3.5 text-emerald-400" />
            Formalização Legal do Contrato (PDF)
          </span>
          <span className="text-[11px] text-zinc-500">Identificação das partes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="owner-cpf" className="flex items-center gap-1.5 text-xs text-zinc-300">
              <User className="size-3.5 text-emerald-400" />
              CPF do Proprietário
            </Label>
            <Input
              id="owner-cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              className="h-10 bg-zinc-900 border-zinc-800 font-mono focus:border-emerald-500/50 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner-rg" className="flex items-center gap-1.5 text-xs text-zinc-300">
              <FileSignature className="size-3.5 text-emerald-400" />
              RG do Proprietário
            </Label>
            <Input
              id="owner-rg"
              placeholder="00.000.000-0"
              maxLength={13}
              value={rg}
              onChange={(e) => handleRgChange(e.target.value)}
              className="h-10 bg-zinc-900 border-zinc-800 font-mono focus:border-emerald-500/50 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 3. BARRA DE AÇÃO UNIFICADA */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {commission?.status !== 'received' && (
          <Button
            type="button"
            onClick={handleSaveAndGenerate}
            disabled={isSaving || isGeneratingAgreement}
            className="h-11 flex-1 min-w-[220px] text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all disabled:opacity-50"
          >
            {isSaving || isGeneratingAgreement ? (
              <>
                <Loader2 className="size-4 animate-spin text-zinc-950" />
                <span>Processando e Emitindo Contrato...</span>
              </>
            ) : (
              <>
                <FileSignature className="size-4" />
                <span>
                  {agreementUrl
                    ? 'Salvar e Atualizar Contrato PDF'
                    : isAgreementDataValid
                    ? 'Salvar e Gerar Contrato PDF'
                    : 'Salvar Comissão & Gerar Contrato'}
                </span>
              </>
            )}
          </Button>
        )}

        {/* Botão Cancelar Edição se aplicável */}
        {hasGeneratedAgreement && isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="h-11 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
          >
            Voltar para Visão do Contrato
          </Button>
        )}
      </div>

      {/* Modais de Suporte */}
      {commission?.id && (
        <CommissionHistoryModal
          commissionId={commission.id}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      )}
    </div>
  );
}
