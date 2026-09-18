'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderStatusData {
  success: boolean;
  orderId: string;
  status: string;
  isPaid: boolean;
  isGranted: boolean;
  creditsQuantity: number;
  newAvailableBalance?: number;
  amountFormatted: string;
  grantedAt?: string;
  message: string;
  error?: string;
}

export default function PackageReturnPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.orderId === 'string' ? params.orderId : '';

  const [statusData, setStatusData] = useState<OrderStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await fetch(`/api/cliente/credit-packages/orders/${orderId}/status`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusData(data);
        return data;
      } else {
        setStatusData((prev) => ({
          success: false,
          orderId,
          status: 'error',
          isPaid: false,
          isGranted: false,
          creditsQuantity: 0,
          amountFormatted: '',
          message: data.error || 'Não foi possível carregar o status do pedido.',
        }));
      }
    } catch {
      // Falha de rede transitória
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();

    // Polling ativo a cada 2.5 segundos enquanto pendente (até 25 tentativas = ~1 minuto)
    const interval = setInterval(async () => {
      setPollCount((prev) => {
        if (prev >= 25) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });

      const updated = await fetchStatus();
      if (updated?.isPaid && updated?.isGranted) {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
  };

  const isApproved = statusData?.isPaid && statusData?.isGranted;
  const isFailed = statusData?.status === 'rejected' || statusData?.status === 'cancelled';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden text-center">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#c9a44c]/10 blur-3xl pointer-events-none rounded-full" />

        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full border-4 border-[#c9a44c]/30 border-t-[#c9a44c] animate-spin" />
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">Consultando seu pedido...</h2>
              <p className="text-xs text-zinc-400">Verificando transação junto ao Mercado Pago.</p>
            </div>
          </div>
        ) : isApproved ? (
          <div className="space-y-6">
            {/* Ícone de Sucesso */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pagamento Aprovado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Créditos Liberados na Sua Conta!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Seu pagamento foi confirmado pelo Mercado Pago e o pacote de consultas já foi liberado no seu saldo.
              </p>
            </div>

            {/* Resumo do Crédito */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-[#c9a44c]/30 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Pacote Adquirido:</span>
                <span className="font-bold text-white">
                  +{statusData?.creditsQuantity} Consultas Veiculares
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Valor Pago:</span>
                <span className="font-bold text-[#e3c56c]">
                  {statusData?.amountFormatted}
                </span>
              </div>
              {statusData?.newAvailableBalance !== undefined && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#c9a44c]" />
                    Saldo Disponível Agora:
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    {statusData.newAvailableBalance} consultas
                  </span>
                </div>
              )}
            </div>

            {/* Ações pós-compra */}
            <div className="space-y-2 pt-2">
              <Link href="/cliente/consultas/nova" className="block w-full">
                <Button
                  size="lg"
                  className="w-full bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-black text-xs sm:text-sm rounded-xl py-5 shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Realizar Consulta Veicular Agora
                </Button>
              </Link>

              <Link href="/cliente/creditos" className="block w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:text-white text-xs rounded-xl py-4"
                >
                  Ver Extrato Completo de Créditos
                </Button>
              </Link>
            </div>
          </div>
        ) : isFailed ? (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Pagamento Não Concluído
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {statusData?.message || 'A transação não foi aprovada pelo provedor de pagamento.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link href="/cliente/creditos" className="block w-full">
                <Button
                  size="lg"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs sm:text-sm rounded-xl py-5"
                >
                  Voltar para Catálogo de Pacotes
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Pendente com Polling */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Processando no Mercado Pago</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Confirmando seu Pagamento
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Estamos sincronizando seu pedido com o Mercado Pago. Assim que a aprovação for confirmada, seus créditos serão liberados automaticamente nesta tela.
              </p>
            </div>

            {/* Cartão de acompanhamento */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Atualização automática ativa</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-xs font-bold text-[#e3c56c] hover:text-[#c9a44c] hover:bg-transparent"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar agora
              </Button>
            </div>

            <div className="pt-2">
              <Link href="/cliente/creditos" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700/70 text-zinc-300 text-xs rounded-xl py-4"
                >
                  Ir para a Área de Créditos
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
