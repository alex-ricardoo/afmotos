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

const BACKOFF_INTERVALS_MS = [0, 3000, 8000, 15000];

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
  const [reportUrl, setReportUrl] = useState(`/cliente/consultas/${consultationId}`);
  const [pollingStep, setPollingStep] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const initialReconcileAttempted = useRef(false);

  const isTerminal =
    (status === 'approved' && consultationStatus === 'completed') ||
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'refunded' ||
    consultationStatus === 'refunded' ||
    consultationStatus === 'failed_permanent';

  // Consulta padrão de leitura de status no backend
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/mp/transactions/${transactionId}/status`);
      if (!res.ok) return;

      const data: TransactionStatusResponse = await res.json();
      if (data.success) {
        setStatus(data.status);
        setConsultationStatus(data.consultationStatus);
        if (data.reportUrl) {
          setReportUrl(data.reportUrl);
        }
      }
    } catch (err) {
      console.error('[PaymentReturnStatus] Erro no polling de status:', err);
    }
  }, [transactionId]);

  // Fallback de Reconciliação Server-Side sob demanda
  const reconcileStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/mp/transactions/${transactionId}/reconcile`, {
        method: 'POST',
      });
      if (!res.ok) return;

      const data: ReconciliationResponse = await res.json();
      if (data.success) {
        setStatus(data.status);
        if (data.status === 'approved' && data.reportUnlocked) {
          setConsultationStatus('completed');
        }
        if (data.reportUrl) {
          setReportUrl(data.reportUrl);
        }
      }
    } catch (err) {
      console.error('[PaymentReturnStatus] Erro na reconciliação de status:', err);
    }
  }, [transactionId]);

  // Reconciliação imediata na montagem se o pagamento ainda estiver pendente
  useEffect(() => {
    if (!initialReconcileAttempted.current && status !== 'approved' && !isTerminal) {
      initialReconcileAttempted.current = true;
      reconcileStatus();
    }
  }, [status, isTerminal, reconcileStatus]);

  // Polling automático com backoff progressivo (0s, 3s, 8s, 15s)
  useEffect(() => {
    if (isTerminal || pollingStep >= BACKOFF_INTERVALS_MS.length) return;

    const intervalTime = BACKOFF_INTERVALS_MS[pollingStep] ?? 15000;
    const timer = setTimeout(async () => {
      await checkStatus();
      setPollingStep((prev) => prev + 1);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [isTerminal, pollingStep, checkStatus]);

  // Ação manual: força reconciliação antes de checar status
  const handleManualRefresh = async () => {
    setIsManualChecking(true);
    await reconcileStatus();
    await checkStatus();
    setIsManualChecking(false);
  };

  // 1. Estado: Aprovado e Laudo Pronto
  if (status === 'approved' && consultationStatus === 'completed') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pagamento Confirmado com Sucesso!
          </h1>
          <p className="text-sm text-zinc-300">
            A consulta da placa <span className="font-mono text-white font-semibold">{plate}</span>{' '}
            foi processada e seu laudo veicular já está liberado.
          </p>
        </div>

        <div className="pt-2">
          <Link href={reportUrl}>
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-6 rounded-xl text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
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
  if (status === 'refunded' || consultationStatus === 'refunded') {
    return (
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pagamento Estornado com Sucesso
          </h1>
          <p className="text-sm text-zinc-300">
            Seu pagamento para a placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span> foi estornado
            integralmente no Mercado Pago.
          </p>
          <p className="text-xs text-zinc-400 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            O prazo para o valor constar depende do método de pagamento utilizado (PIX é instantâneo;
            cartão de crédito segue as regras do seu banco).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link href="/cliente/consultas" className="flex-1">
            <Button
              type="button"
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl"
            >
              Minhas Consultas
            </Button>
          </Link>
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

  // 3. Estado: Falha Definitiva com Estorno em Andamento (Refund Pending / Failed Permanent)
  if (consultationStatus === 'failed_permanent' || consultationStatus === 'refund_pending') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Consulta Indisponível</h1>
          <p className="text-sm text-zinc-300">
            Não foi possível concluir a busca do histórico veicular para a placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span> devido a uma
            indisponibilidade momentânea nos registros oficiais.
          </p>
          <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
            Para sua segurança, já solicitamos o <strong>estorno integral automático</strong> do seu
            pagamento junto ao Mercado Pago. Você não sofrerá nenhuma cobrança.
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
            Atualizar Status
          </Button>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
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

  // 4. Estado: Instabilidade Transitória (Retry Scheduled)
  if (consultationStatus === 'retry_scheduled') {
    return (
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Preparando seu Laudo...</h1>
          <p className="text-sm text-zinc-300">
            Confirmamos seu pagamento com sucesso. Estamos enfrentando uma instabilidade temporária
            na comunicação com as bases oficiais para a placa{' '}
            <span className="font-mono text-white font-semibold">{plate}</span>.
          </p>
          <p className="text-xs text-sky-300 bg-sky-950/40 p-3 rounded-lg border border-sky-800/40">
            Nossa equipe já está acompanhando e o sistema tentará gerar o documento novamente de forma
            automática.
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
            Atualizar Agora
          </Button>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Suporte WhatsApp
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 5. Estado: Pagamento Aprovado, gerando Laudo
  if (status === 'approved') {
    return (
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pagamento Aprovado! Gerando Laudo...
          </h1>
          <p className="text-sm text-zinc-300">
            Confirmamos seu pagamento com sucesso. Estamos consultando as bases oficiais de dados do
            veículo para a placa <span className="font-mono text-white font-semibold">{plate}</span>
            .
          </p>
          <p className="text-xs text-zinc-400">Isso geralmente leva menos de 10 segundos.</p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isManualChecking}
            onClick={handleManualRefresh}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            {isManualChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar Agora
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
            O pagamento para a placa{' '}
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

  // 7. Estado: Aguardando Confirmação
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-8 sm:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl">
      <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <Clock className="h-9 w-9" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Aguardando Confirmação do Pagamento
        </h1>
        <p className="text-sm text-zinc-300 font-medium">
          Estamos confirmando seu pagamento com segurança. Isso pode levar alguns instantes.
        </p>
        <p className="text-xs text-zinc-400 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
          Assim que o Mercado Pago validar a liquidação, seu laudo será desbloqueado
          automaticamente. Você também pode clicar em &quot;Verificar Status&quot; ou acompanhar pela tela
          de Minhas Consultas.
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
              Suporte WhatsApp
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
