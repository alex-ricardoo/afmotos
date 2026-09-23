'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  FileText,
  RefreshCw,
  MessageCircle,
  ArrowRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  type TransactionStatusResponse,
  type ReconciliationResponse,
  type PaymentTransactionStatus,
} from '@/lib/mercadopago/types';

interface PaymentReturnStatusProps {
  transactionId: string;
  consultationId: string;
  plate: string;
  initialStatus: PaymentTransactionStatus;
  initialConsultationStatus: string;
  whatsappUrl?: string | null;
}

export function PaymentReturnStatus({
  transactionId,
  consultationId,
  plate,
  initialStatus,
  initialConsultationStatus,
  whatsappUrl,
}: PaymentReturnStatusProps) {
  const [status, setStatus] = useState<PaymentTransactionStatus>(initialStatus);
  const [consultationStatus, setConsultationStatus] = useState(initialConsultationStatus);
  const [refundStatus, setRefundStatus] = useState<string>('none');
  const [reportUrl, setReportUrl] = useState(`/cliente/consultas/${consultationId}`);
  const [nextRetryAt, setNextRetryAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);

  const initialDeliveryAttempted = useRef(false);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isTerminal =
    (status === 'approved' && consultationStatus === 'completed') ||
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'refunded' ||
    consultationStatus === 'refunded' ||
    refundStatus === 'confirmed' ||
    consultationStatus === 'failed_permanent' ||
    consultationStatus === 'manual_review';

  // 1. Consulta autoritativa de status no backend
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/mp/transactions/${transactionId}/status`);
      if (!res.ok) return null;

      const data: TransactionStatusResponse = await res.json();
      if (data.success) {
        setStatus(data.status);
        setConsultationStatus(data.consultationStatus);
        if (data.refundStatus) {
          setRefundStatus(data.refundStatus);
        }
        if (data.reportUrl) {
          setReportUrl(data.reportUrl);
        }
        if (data.nextRetryAt) {
          setNextRetryAt(data.nextRetryAt);
        }
        return data;
      }
    } catch (err) {
      console.error('[PaymentReturnStatus] Erro ao buscar status:', err);
    }
    return null;
  }, [transactionId]);

  // 2. Disparo de Processamento / Retentativa de Entrega em Tela
  const triggerProcessDelivery = useCallback(async () => {
    if (isProcessingDelivery || isTerminal) return;

    setIsProcessingDelivery(true);
    try {
      const res = await fetch(`/api/cliente/consultas/${consultationId}/process-delivery`, {
        method: 'POST',
      });

      if (!res.ok) {
        await checkStatus();
        return;
      }

      const data = await res.json();
      if (data.success) {
        if (data.status === 'completed') {
          setConsultationStatus('completed');
          setReportUrl(`/cliente/consultas/${consultationId}`);
          setNextRetryAt(null);
        } else if (data.status === 'retry_scheduled') {
          setConsultationStatus('retry_scheduled');
          if (data.nextRetryAt) {
            setNextRetryAt(data.nextRetryAt);
          }
        } else if (data.status) {
          setConsultationStatus(data.status);
        }
      } else {
        await checkStatus();
      }
    } catch (err) {
      console.error('[PaymentReturnStatus] Erro ao acionar entrega em tela:', err);
      await checkStatus();
    } finally {
      setIsProcessingDelivery(false);
    }
  }, [consultationId, isProcessingDelivery, isTerminal, checkStatus]);

  // 3. Fallback de Reconciliação Server-Side do Pagamento
  const reconcilePayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/mp/transactions/${transactionId}/reconcile`, {
        method: 'POST',
      });
      if (!res.ok) return null;

      const data: ReconciliationResponse = await res.json();
      if (data.success) {
        setStatus(data.status);
        if (data.status === 'approved' && data.reportUnlocked) {
          setConsultationStatus('completed');
        }
        if (data.reportUrl) {
          setReportUrl(data.reportUrl);
        }
        return data;
      }
    } catch (err) {
      console.error('[PaymentReturnStatus] Erro na reconciliação de pagamento:', err);
    }
    return null;
  }, [transactionId]);

  // 4. Execução imediata na montagem: se pagamento aprovado e laudo pendente, tenta entrega uma vez
  useEffect(() => {
    if (initialDeliveryAttempted.current) return;
    initialDeliveryAttempted.current = true;

    async function handleInitialMount() {
      if (status === 'approved' && consultationStatus !== 'completed' && !isTerminal) {
        await triggerProcessDelivery();
      } else if (status !== 'approved' && !isTerminal) {
        const rec = await reconcilePayment();
        if (rec && rec.status === 'approved' && !rec.reportUnlocked) {
          await triggerProcessDelivery();
        }
      }
    }

    handleInitialMount();
  }, [status, consultationStatus, isTerminal, reconcilePayment, triggerProcessDelivery]);

  // 5. Polling inteligente
  useEffect(() => {
    if (isTerminal) return;

    const interval = setInterval(async () => {
      await checkStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [isTerminal, checkStatus]);

  // 6. Agendamento inteligente de Retry baseado no nextRetryAt retornado pelo servidor
  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isTerminal || consultationStatus !== 'retry_scheduled' || !nextRetryAt) {
      return;
    }

    const targetTime = new Date(nextRetryAt).getTime();
    const initialDelay = targetTime - Date.now();

    if (initialDelay <= 0) {
      retryTimerRef.current = setTimeout(() => {
        triggerProcessDelivery();
      }, 0);
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }, 1000);

    retryTimerRef.current = setTimeout(() => {
      triggerProcessDelivery();
    }, initialDelay + 500);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [consultationStatus, nextRetryAt, isTerminal, triggerProcessDelivery]);

  // 7. Ação Manual: "Verificar Status"
  const handleManualRefresh = async () => {
    setIsManualChecking(true);
    try {
      if (
        consultationStatus === 'refund_pending' ||
        refundStatus === 'pending' ||
        refundStatus === 'requested'
      ) {
        try {
          await fetch(`/api/mp/transactions/${transactionId}/refund/reconcile`, { method: 'POST' });
        } catch {
          // segue para checkStatus
        }
      } else if (status !== 'approved') {
        await reconcilePayment();
      }
      const updatedStatus = await checkStatus();
      if (
        (updatedStatus?.status === 'approved' || status === 'approved') &&
        updatedStatus?.consultationStatus !== 'completed' &&
        !isTerminal
      ) {
        await triggerProcessDelivery();
      }
    } finally {
      setIsManualChecking(false);
    }
  };

  // Suporte contextualizado e seguro
  const supportMessage = `Olá! Meu pagamento para a consulta da placa ${plate} (referência ${consultationId.slice(0, 8)}) foi aprovado, mas a consulta não pôde ser concluída e preciso de suporte com o estorno.`;
  const safeSupportUrl = whatsappUrl
    ? `${whatsappUrl.split('?')[0]}?text=${encodeURIComponent(supportMessage)}`
    : null;

  // -------------------------------------------------------------
  // RENDERIZAÇÃO VISUAL BASEADA NOS ESTADOS OFICIAIS
  // -------------------------------------------------------------

  // 1. Estado: Aprovado e Laudo Pronto (Completed)
  if (status === 'approved' && consultationStatus === 'completed') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Pagamento Confirmado!</h1>
          <p className="text-sm text-zinc-300">
            Seu laudo para a placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span> já foi gerado e está
            pronto para consulta.
          </p>
        </div>

        <div className="pt-2">
          <Link href={reportUrl}>
            <Button
              type="button"
              className="w-full bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#c9a44c]/20"
            >
              <FileText className="h-5 w-5" />
              Visualizar Laudo Completo
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Estado: Estorno Confirmado (Refunded)
  if (status === 'refunded' || consultationStatus === 'refunded' || refundStatus === 'confirmed') {
    return (
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Estorno Confirmado</h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Identificamos uma <strong className="text-zinc-100">instabilidade temporária</strong> no
            serviço de dados ao consultar a placa{' '}
            <span className="font-mono font-bold text-white">{plate}</span>. Para garantir sua
            segurança e comodidade, seu pagamento foi{' '}
            <span className="font-semibold text-purple-300">estornado integralmente</span>.
          </p>

          <div className="text-left bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 space-y-2.5 text-xs text-zinc-400">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-zinc-200 font-medium">O que você pode fazer agora:</strong>{' '}
                Você pode tentar realizar uma nova consulta mais tarde quando o sistema estiver
                normalizado, ou entrar em contato com nossa equipe no botão de suporte abaixo para
                qualquer esclarecimento.
              </p>
            </div>
            <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/60">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-zinc-300 font-medium">Prazo para crédito:</strong> No Pix, o
                valor geralmente retorna em instantes na mesma conta bancária utilizada. No cartão
                de crédito, o prazo depende da operadora do cartão e da data de fechamento da sua
                fatura.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 font-mono">
            Ref. da consulta: {consultationId.slice(0, 8)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/cliente/consultas/nova" className="flex-1">
            <Button
              type="button"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
            >
              Tentar Novamente Mais Tarde
            </Button>
          </Link>
          <Link href="/cliente/consultas" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-semibold rounded-xl"
            >
              Minhas Consultas
            </Button>
          </Link>
        </div>

        {safeSupportUrl && (
          <div className="pt-1">
            <a
              href={safeSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Suporte no WhatsApp
              </Button>
            </a>
          </div>
        )}
      </div>
    );
  }

  // 3. Estado: Falha de Estorno / Manual Review
  if (
    refundStatus === 'failed' ||
    refundStatus === 'manual_review' ||
    consultationStatus === 'manual_review'
  ) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="h-9 w-9" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Finalizando Confirmação do Estorno
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Houve uma instabilidade temporária ao consultar os dados da placa{' '}
            <span className="font-mono font-semibold text-white">{plate}</span> e a devolução do seu
            pagamento já foi acionada.
          </p>

          <div className="text-left bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 space-y-2 text-xs text-zinc-400">
            <p className="leading-relaxed">
              <strong className="text-zinc-200 font-medium">Por que está em finalização?</strong>{' '}
              Para assegurar que a devolução ocorra com precisão, o estorno está passando por uma
              breve validação preventiva com nossa equipe e a operadora de pagamento.
            </p>
            <p className="leading-relaxed text-zinc-300">
              Fique tranquilo: <strong className="text-white">nenhum valor será retido</strong>.
              Você pode clicar em &quot;Verificar Novamente&quot; para atualizar o status ou falar
              diretamente com nosso suporte para agilizar o atendimento.
            </p>
          </div>

          <p className="text-xs text-red-300/90 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40 font-medium">
            Referência da consulta:{' '}
            <span className="font-mono font-bold text-white">{consultationId.slice(0, 8)}</span>{' '}
            (Placa {plate})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking}
            onClick={handleManualRefresh}
            className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-xl"
          >
            {isManualChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Novamente
          </Button>

          {safeSupportUrl && (
            <a href={safeSupportUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 rounded-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Suporte
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 4. Estado: Estorno Pendente
  if (refundStatus === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="h-9 w-9 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Estorno Pendente</h1>
          <p className="text-sm text-zinc-300">
            Seu estorno foi solicitado e está sendo processado pelo Mercado Pago.
          </p>
          <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
            Assim que o provedor concluir o processamento, a confirmação será atualizada
            automaticamente nesta página.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking}
            onClick={handleManualRefresh}
            className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-2"
          >
            {isManualChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>

          {safeSupportUrl && (
            <a href={safeSupportUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Suporte
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 5. Estado: Estorno Solicitado
  if (
    refundStatus === 'requested' ||
    consultationStatus === 'failed_permanent' ||
    consultationStatus === 'refund_pending'
  ) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Estorno Solicitado</h1>
          <p className="text-sm text-zinc-300">
            Não foi possível concluir sua consulta neste momento porque o serviço de dados está
            temporariamente indisponível.
          </p>
          <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
            Solicitamos o <strong>estorno integral</strong> do seu pagamento. A confirmação será
            atualizada automaticamente nesta página. Você não precisa realizar um novo pagamento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking}
            onClick={handleManualRefresh}
            className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-2"
          >
            {isManualChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>

          {safeSupportUrl && (
            <a href={safeSupportUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Suporte
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 6. Estado: Instabilidade Temporária com Retentativa em Tela (Retry Scheduled)
  if (consultationStatus === 'retry_scheduled') {
    return (
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Instabilidade Temporária na Consulta
          </h1>
          <p className="text-sm text-zinc-300">
            Estamos enfrentando uma instabilidade temporária para consultar a placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span>.
          </p>
          <p className="text-xs text-sky-300 bg-sky-950/40 p-3 rounded-lg border border-sky-800/40 leading-relaxed">
            <strong>Você não precisa pagar novamente.</strong> Tentaremos novamente de forma
            automática enquanto esta página estiver aberta.
            {remainingSeconds !== null && remainingSeconds > 0 && (
              <span className="block mt-2 font-mono text-sky-200">
                Próxima tentativa em: {remainingSeconds}s...
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking || isProcessingDelivery}
            onClick={handleManualRefresh}
            className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-2"
          >
            {isManualChecking || isProcessingDelivery ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Falar com Suporte
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 5. Estado: Pagamento Confirmado, gerando Laudo Inicial (Pending Delivery / Processing)
  if (status === 'approved') {
    return (
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pagamento Confirmado. Estamos Preparando seu Laudo.
          </h1>
          <p className="text-sm text-zinc-300">
            Confirmamos seu pagamento com sucesso. Estamos consultando as bases oficiais para a
            placa <span className="font-mono text-white font-semibold">{plate}</span>.
          </p>
          <p className="text-xs text-zinc-400">Isso geralmente leva menos de 10 segundos.</p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking || isProcessingDelivery}
            onClick={handleManualRefresh}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            {isManualChecking || isProcessingDelivery ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Status
          </Button>
        </div>
      </div>
    );
  }

  // 6. Estado: Rejeitado ou Cancelado
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <XCircle className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Pagamento Não Concluído</h1>
          <p className="text-sm text-zinc-300">
            O pagamento para a consulta da placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span> não foi autorizado
            ou foi cancelado no Mercado Pago. Nenhuma cobrança foi mantida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link href={`/cliente/pagamento/${consultationId}`} className="flex-1">
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
            >
              Tentar Novamente
            </Button>
          </Link>
          <Link href="/cliente/consultas" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Minhas Consultas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 7. Estado: Aguardando Confirmação do Pagamento
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
      <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <Clock className="h-9 w-9" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Estamos Aguardando a Confirmação do seu Pagamento.
        </h1>
        <p className="text-sm text-zinc-300 font-medium">
          Estamos verificando a confirmação do pagamento com o Mercado Pago.
        </p>
        <p className="text-xs text-zinc-400 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
          Assim que for aprovado, seu laudo será gerado automaticamente. Você também pode clicar em
          &quot;Verificar Status&quot; ou acompanhar pela tela de Minhas Consultas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          onClick={handleManualRefresh}
          disabled={isManualChecking}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center justify-center gap-2"
        >
          {isManualChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Verificar Status
        </Button>

        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Falar com Suporte
            </Button>
          </a>
        )}
      </div>

      <div>
        <Link
          href="/cliente/consultas"
          className="text-xs text-zinc-400 hover:text-white underline transition-colors"
        >
          Voltar para Minhas Consultas
        </Link>
      </div>
    </div>
  );
}
