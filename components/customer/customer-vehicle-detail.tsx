'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileSpreadsheet,
  DollarSign,
  Lock,
  History,
  Tag,
  Gauge,
  Cpu,
  ArrowLeft,
  Download,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  Building2,
  Wrench,
  Car,
  Gavel,
  Scale,
  Sparkles,
  Calendar,
  MapPin,
  Palette,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerPlateBadge } from './customer-plate-badge';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import type { ConsultationDetail } from '@/lib/customer/types';
import { Button } from '@/components/ui/button';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { TabVehicleData } from '@/components/admin/vehicle-lookup/tabs/tab-vehicle-data';
import { TabDebts } from '@/components/admin/vehicle-lookup/tabs/tab-debts';
import { TabRestrictions } from '@/components/admin/vehicle-lookup/tabs/tab-restrictions';
import { TabHistory } from '@/components/admin/vehicle-lookup/tabs/tab-history';
import { TabFipePricing } from '@/components/admin/vehicle-lookup/tabs/tab-fipe-pricing';
import { TabAdsMileage } from '@/components/admin/vehicle-lookup/tabs/tab-ads-mileage';
import { TabTechnicalSpecs } from '@/components/admin/vehicle-lookup/tabs/tab-technical-specs';

interface CustomerVehicleDetailProps {
  consultation: ConsultationDetail;
  dto: InternalVehicleConsultationDto | null;
}

type TabKey =
  'summary' | 'vehicle' | 'debts' | 'restrictions' | 'history' | 'fipe' | 'ads' | 'technical';

export function CustomerVehicleDetail({ consultation, dto }: CustomerVehicleDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  // Desktop horizontal scroll support for tabs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      const el = tabsContainerRef.current;
      if (!el) return;
      el.scrollLeft += e.deltaY;
    }
  };

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'summary', label: 'Resumo & Riscos', icon: ShieldCheck },
    { key: 'vehicle', label: 'Dados do Veículo', icon: FileSpreadsheet },
    { key: 'debts', label: 'Situação & Débitos', icon: DollarSign },
    { key: 'restrictions', label: 'Restrições & Gravames', icon: Lock },
    { key: 'history', label: 'Histórico & Donos', icon: History },
    { key: 'fipe', label: 'Preço & FIPE', icon: Tag },
    { key: 'ads', label: 'Anúncios & Km', icon: Gauge },
    { key: 'technical', label: 'Dados Técnicos', icon: Cpu },
  ];

  const formattedDate = new Date(
    consultation.processed_at || consultation.created_at,
  ).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isOfficialReport =
    consultation.status === 'completed' &&
    consultation.payment_status === 'paid' &&
    dto?.is_mock === false &&
    dto?.mode === 'live';

  const pdfDownloadUrl = `/api/cliente/consultas/${consultation.id}/pdf`;
  const pdfFilename = `${isOfficialReport ? 'laudo-veicular' : 'demonstracao-veicular'}_${consultation.plate_normalized}_${consultation.id.slice(0, 8)}.pdf`;
  const formattedPlate = formatBrazilianPlate(consultation.plate);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);
      toast.info(
        isOfficialReport
          ? 'Gerando seu Laudo Oficial em PDF...'
          : 'Gerando prévia de demonstração em PDF...',
        {
          description: isOfficialReport
            ? 'Compilando histórico, dados dos órgãos e laudo de procedência.'
            : 'Compilando dados de exemplo e simulação de laudo veicular.',
        },
      );

      const response = await fetch(pdfDownloadUrl);
      if (response.status === 403) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Laudo oficial indisponível para registros simulados.');
      }
      if (!response.ok) {
        throw new Error(`Falha ao gerar o PDF (Status ${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      setDownloadSuccess(true);
      toast.success(
        isOfficialReport
          ? 'Laudo Oficial baixado com sucesso!'
          : 'Prévia de demonstração baixada com sucesso!',
      );
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2500);
    } catch (err: unknown) {
      console.error('Erro ao baixar laudo em PDF:', err);
      const msg =
        err instanceof Error ? err.message : 'Erro ao gerar laudo em PDF. Tente novamente.';
      toast.error(msg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!dto) {
    const isRefunded = consultation.status === 'refunded';
    const isRefundPending = consultation.status === 'refund_pending';
    const isFailed =
      consultation.status === 'failed' ||
      consultation.status === 'failed_permanent' ||
      isRefundPending ||
      isRefunded;

    const isPendingPayment = consultation.status === 'pending';

    return (
      <div className="space-y-6">
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white mb-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
          <span>Voltar para Minhas Consultas</span>
        </Link>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto shadow-2xl">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
              isRefunded
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                : isRefundPending
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : isFailed
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : isPendingPayment
                      ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            }`}
          >
            {isRefunded ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isRefundPending ? (
              <Clock className="w-8 h-8 animate-pulse" />
            ) : isFailed ? (
              <AlertTriangle className="w-8 h-8" />
            ) : isPendingPayment ? (
              <CreditCard className="w-8 h-8" />
            ) : (
              <Loader2 className="w-8 h-8 animate-spin" />
            )}
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
              {isRefunded ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/25">
                  Estorno Confirmado
                </span>
              ) : isRefundPending ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  Estorno Solicitado
                </span>
              ) : isFailed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/25">
                  Consulta Não Concluída
                </span>
              ) : isPendingPayment ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                  Aguardando Pagamento
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 animate-pulse">
                  Processando Laudo
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-white">Consulta da Placa {formattedPlate}</h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
              {isRefunded ? (
                <>
                  Identificamos uma{' '}
                  <strong className="text-zinc-100">instabilidade temporária</strong> no sistema ao
                  consultar os dados desta placa. Por isso, a consulta não pôde ser emitida e seu
                  pagamento foi{' '}
                  <strong className="text-purple-300 font-semibold">estornado integralmente</strong>
                  . Você pode tentar realizar uma nova consulta mais tarde ou entrar em contato com
                  nosso suporte.
                </>
              ) : isRefundPending ? (
                <>
                  Devido a uma instabilidade temporária no serviço de dados, não foi possível
                  concluir a emissão do laudo. O estorno integral do seu pagamento já foi solicitado
                  e está sendo processado pelo Mercado Pago.
                </>
              ) : consultation.status === 'failed_permanent' || consultation.status === 'failed' ? (
                consultation.payment_coverage_type === 'platform_credit' ? (
                  'Não foi possível concluir a consulta neste momento devido a uma instabilidade temporária. Seu crédito não foi consumido e continua disponível na sua conta.'
                ) : (
                  'Não foi possível concluir a consulta veicular neste momento devido a uma instabilidade temporária. Se o pagamento foi aprovado, o estorno automático foi acionado.'
                )
              ) : consultation.payment_coverage_type === 'platform_credit' &&
                (consultation as { credit_status?: string }).credit_status === 'reserved' ? (
                'Seu crédito foi reservado. Estamos preparando o laudo veicular.'
              ) : consultation.status === 'pending' ? (
                'Esta consulta está aguardando a confirmação do pagamento para liberar o laudo completo.'
              ) : (
                'O relatório desta consulta está sendo processado. Aguarde alguns instantes.'
              )}
            </p>

            {isRefunded && (
              <div className="text-left bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs text-zinc-400 max-w-md mx-auto">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-zinc-200">Motivo:</strong> Instabilidade temporária de
                    comunicação com as bases de consulta veicular.
                  </p>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-zinc-800/60">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-zinc-300">Prazo para crédito:</strong> No Pix, o valor
                    retorna em instantes na mesma conta; no cartão de crédito, o prazo depende da
                    sua instituição financeira e da data de fechamento da fatura.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isPendingPayment ? (
              <Link href={`/cliente/pagamento/${consultation.id}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold rounded-xl shadow-lg shadow-[#c9a44c]/20 flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Ir para Pagamento</span>
                </Button>
              </Link>
            ) : isFailed ? (
              <>
                <Link
                  href={`/cliente/consultas/nova?placa=${consultation.plate}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    className={`w-full sm:w-auto h-11 px-6 ${
                      isRefunded
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/20'
                        : 'bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 shadow-[#c9a44c]/20'
                    } font-bold rounded-xl shadow-lg`}
                  >
                    Tentar Nova Consulta
                  </Button>
                </Link>
                <Link href="/cliente/consultas" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
                  >
                    Minhas Consultas
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto h-11 px-6 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl"
              >
                Atualizar Página
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const s = dto.summary;
  const h = dto.history;
  type RawVehicleData = Record<string, unknown> & {
    registroEmLocadora?: { registroEmLocadora?: boolean };
    registro_locadora?: boolean;
    registro_em_locadora?: boolean;
  };
  const raw = (dto.raw_response?.data || dto.raw_response || {}) as RawVehicleData;

  const pendingRecalls = h.recalls ? h.recalls.filter((r) => r.status === 'PENDENTE') : [];
  const hasPendingRecall = pendingRecalls.length > 0;

  const isLocadora = Boolean(
    raw.registroEmLocadora?.registroEmLocadora === true ||
    raw.registro_locadora === true ||
    raw.registro_em_locadora === true ||
    /LOCADORA/i.test(JSON.stringify(h.previous_owners || '')),
  );

  // Market & Ads variables
  const latestAdWithPrice =
    dto.ads_mileage?.ads_records?.find((a) => (a.price || 0) > 0) ||
    dto.ads_mileage?.ads_records?.[0];
  const adPrice = latestAdWithPrice?.price || 0;
  const fipePrice = dto.fipe?.price || 0;
  const latestKm =
    dto.ads_mileage?.mileage_records?.[0]?.mileage || latestAdWithPrice?.mileage || 0;

  // Risk Level Config
  const riskConfig = (() => {
    switch (s.risk_level) {
      case 'LOW':
        return {
          title: 'Procedência Regular (Risco Baixo)',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          barColor: 'from-emerald-500 to-emerald-400',
          desc: 'Nenhum apontamento grave detectado. Veículo apto para negociação sem restrições impeditivas.',
        };
      case 'MEDIUM':
        return {
          title: 'Atenção Moderada (Risco Médio)',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          barColor: 'from-amber-500 to-amber-400',
          desc: 'Constam apontamentos financeiros ou cadastrais (como gravame ativo ou débitos). Requer atenção antes da transferência.',
        };
      case 'HIGH':
      case 'CRITICAL':
        return {
          title: 'Alto Risco / Atenção Crítica',
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/30',
          barColor: 'from-red-500 to-red-400',
          desc: 'Constam apontamentos graves (bloqueio judicial, queixa ou histórico de sinistro/leilão). Negociação de alto risco.',
        };
      default:
        return {
          title: 'Análise Concluída',
          color: 'text-zinc-300',
          bg: 'bg-zinc-800 border-zinc-700',
          barColor: 'from-zinc-500 to-zinc-400',
          desc: 'Classificação gerada a partir das bases oficiais de trânsito e segurança pública.',
        };
    }
  })();

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Executive Vehicle Header Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-[#0e121a] via-[#0a0d14] to-[#07090f] backdrop-blur-2xl p-4 sm:p-7 shadow-2xl relative overflow-hidden space-y-5 sm:space-y-6">
        {/* Subtle Ambient Gold Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
          <Link
            href="/cliente/consultas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
            <span>Voltar para Minhas Consultas</span>
          </Link>

          <div className="flex items-center gap-2">
            {isOfficialReport ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Laudo Oficial Emitido
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/25">
                  <Sparkles className="w-3 h-3" />
                  Base Senatran
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Dados de demonstração (Ambiente de Teste)
              </span>
            )}
          </div>
        </div>

        {/* Main Identity Row: Plate, Title & Download Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Authentic Mercosul or Legacy Plate Graphic */}
            <CustomerPlateBadge
              plate={dto.plate_display || formattedPlate}
              size="lg"
              className="shrink-0 shadow-xl"
            />

            {/* Vehicle Title & Badges */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-heading leading-tight">
                <span className="text-[#c9a44c]">{s.brand}</span> {s.model}
              </h1>

              {s.version && (
                <p className="text-xs sm:text-sm text-zinc-300 font-medium">{s.version}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${riskConfig.bg} ${riskConfig.color}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {riskConfig.title}
                </span>

                {s.has_debts ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Débitos: R$ {s.debts_total_amount.toFixed(2).replace('.', ',')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    Débitos Quitados
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs: Download PDF with loading state */}
          <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              aria-label={
                isOfficialReport ? 'Baixar Laudo Oficial em PDF' : 'Baixar Prévia de Demonstração'
              }
              className={`h-12 px-6 rounded-xl font-black text-xs sm:text-sm shadow-xl inline-flex items-center justify-center gap-2.5 transition-all select-none relative overflow-hidden group ${
                isDownloadingPdf
                  ? 'bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] opacity-90 cursor-wait shadow-[#c9a44c]/30 text-zinc-950'
                  : downloadSuccess
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 active:scale-95'
                    : isOfficialReport
                      ? 'bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] hover:brightness-110 active:scale-95 text-zinc-950 shadow-[#c9a44c]/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 shadow-md'
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none ${
                  isDownloadingPdf
                    ? 'animate-[shimmer_1.5s_infinite] -translate-x-full'
                    : '-translate-x-full group-hover:translate-x-full duration-1000'
                }`}
              />
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 stroke-[2.5] animate-spin text-zinc-950" />
                  <span>
                    {isOfficialReport ? 'Gerando Laudo Oficial...' : 'Gerando Demonstração...'}
                  </span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5] text-zinc-950" />
                  <span>{isOfficialReport ? 'Laudo Baixado!' : 'Demonstração Baixada!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isOfficialReport
                      ? 'Baixar Laudo Oficial PDF'
                      : 'Baixar Prévia de Demonstração'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vehicle Quick Specs Strip */}
        <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Ano Fab/Mod
              </span>
              <span className="font-bold text-white truncate block">{s.year_fab_mod || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Cor Oficial
              </span>
              <span className="font-bold text-white truncate block">{s.color || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Local de Registro
              </span>
              <span className="font-bold text-white truncate block">{s.city_state || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Consultado em
              </span>
              <span className="font-bold text-white truncate block">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Segmented Pill Tabs Navigation with Desktop & Mobile Scroll Controls */}
      <div className="relative group bg-[#0b0e15] border border-zinc-800/80 p-1.5 rounded-2xl shadow-xl">
        {/* Left Scroll Button (Desktop) */}
        {canScrollLeft && (
          <div className="absolute left-1.5 top-1.5 bottom-1.5 z-10 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="h-full px-2.5 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 shadow-lg shadow-black/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Rolar opções para esquerda"
              title="Rolar abas para esquerda"
            >
              <ChevronLeft className="w-4 h-4 text-[#c9a44c]" />
            </button>
          </div>
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={tabsContainerRef}
          onWheel={handleWheel}
          className="overflow-x-auto scrollbar-none scroll-smooth px-1"
        >
          <div className="flex items-center gap-1.5 min-w-max py-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'center',
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] text-zinc-950 shadow-md shadow-[#c9a44c]/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Button (Desktop) */}
        {canScrollRight && (
          <div className="absolute right-1.5 top-1.5 bottom-1.5 z-10 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="h-full px-2.5 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 shadow-lg shadow-black/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Rolar opções para direita"
              title="Rolar abas para direita"
            >
              <ChevronRight className="w-4 h-4 text-[#c9a44c]" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Executive Resumo & Riscos */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Diagnostic & Risk Index Hero */}
          <div className="p-4 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e131d] via-[#090c13] to-[#07090f] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Diagnóstico Geral de Procedência
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${riskConfig.bg} ${riskConfig.color}`}
                  >
                    {riskConfig.title}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {s.risk_index}{' '}
                    <span className="text-base sm:text-lg font-medium text-zinc-500">/ 100</span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    (Índice de Risco Calculado)
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${riskConfig.barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(Math.max(s.risk_index, 5), 100)}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{riskConfig.desc}</p>
              </div>

              {/* 3 Quick KPI Stat Blocks */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Total Débitos
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black font-mono block ${s.has_debts ? 'text-amber-400' : 'text-emerald-400'}`}
                  >
                    {s.has_debts ? `R$ ${s.debts_total_amount.toFixed(2)}` : 'R$ 0,00'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {s.has_debts ? 'Com pendências' : 'Tudo Quitado'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Gravame
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black block ${s.has_active_gravamen ? 'text-amber-400' : 'text-emerald-400'}`}
                  >
                    {s.has_active_gravamen ? 'Ativo' : 'Livre'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {s.has_active_gravamen ? 'Alienação' : 'Sem dívida'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Roubo/Furto
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black block ${s.has_active_theft_robbery ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {s.has_active_theft_robbery ? 'Alerta' : 'Limpo'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {s.has_active_theft_robbery ? 'Queixa policial' : 'Nada Consta'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 8 Security Inspection Stamp Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Roubo / Furto */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_active_theft_robbery
                  ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Roubo e Furto
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_active_theft_robbery
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {s.has_active_theft_robbery ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_active_theft_robbery ? 'text-red-400' : 'text-white'}`}
              >
                {s.has_active_theft_robbery ? 'Alerta Ativo de Roubo' : 'Sem Queixa de Roubo'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Base Nacional Integrada de Segurança (SINESP)
              </p>
            </div>

            {/* 2. Bloqueio Renajud */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_judicial_restriction
                  ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Bloqueio Renajud
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_judicial_restriction
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {s.has_judicial_restriction ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : (
                    <Scale className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_judicial_restriction ? 'text-red-400' : 'text-white'}`}
              >
                {s.has_judicial_restriction ? 'Bloqueio Judicial Ativo' : 'Sem Bloqueios Judiciais'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Conselho Nacional de Justiça (CNJ)</p>
            </div>

            {/* 3. Alienação / Gravame */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_active_gravamen
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Alienação / Gravame
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_active_gravamen
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {s.has_active_gravamen ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_active_gravamen ? 'text-amber-400' : 'text-white'}`}
              >
                {s.has_active_gravamen ? 'Gravame Financeiro Ativo' : 'Veículo Desalienado'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Sistema Nacional de Gravames (SNG)</p>
            </div>

            {/* 4. Passagem por Leilão */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_auction_record
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Passagem por Leilão
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_auction_record
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {s.has_auction_record ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Gavel className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_auction_record ? 'text-amber-400' : 'text-white'}`}
              >
                {s.has_auction_record ? 'Consta Passagem em Leilão' : 'Sem Registro de Leilão'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Bases de Leiloeiros Oficiais do Brasil
              </p>
            </div>

            {/* 5. Registro de Sinistro */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_accident_indication
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Registro de Sinistro
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_accident_indication
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {s.has_accident_indication ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Car className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_accident_indication ? 'text-amber-400' : 'text-white'}`}
              >
                {s.has_accident_indication
                  ? 'Consta Registro de Sinistro'
                  : 'Sem Registro de Sinistro'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Indicações de avarias em seguradoras</p>
            </div>

            {/* 6. Recall de Fábrica */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                hasPendingRecall
                  ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Recall de Fábrica
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    hasPendingRecall
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {hasPendingRecall ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-sm font-black ${hasPendingRecall ? 'text-red-400' : 'text-white'}`}
              >
                {hasPendingRecall ? `${pendingRecalls.length} Recall Pendente` : 'Sem Pendências'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Sistema Nacional de Recalls (Senatran)
              </p>
            </div>

            {/* 7. Débitos & Multas */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                s.has_debts
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Débitos & Multas
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    s.has_debts
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-sm font-black ${s.has_debts ? 'text-amber-400' : 'text-white'}`}
              >
                {s.has_debts
                  ? `Pendências: R$ ${s.debts_total_amount.toFixed(2)}`
                  : 'Débitos Quitados'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">DETRAN Estadual e órgãos autuadores</p>
            </div>

            {/* 8. Uso em Locadora */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isLocadora
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Uso em Locadora
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isLocadora
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {isLocadora ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className={`text-sm font-black ${isLocadora ? 'text-amber-400' : 'text-white'}`}>
                {isLocadora ? 'Consta Registro em Locadora' : 'Não Consta Registro'}
              </div>
            </div>
          </div>

          {/* Executive Market & Mileage Strip */}
          {(fipePrice > 0 || adPrice > 0 || latestKm > 0) && (
            <div className="p-5 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#c9a44c]" />
                  Referência de Mercado & Odômetro
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ads')}
                  className="text-xs text-[#c9a44c] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Ver histórico completo →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* FIPE */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                    Tabela FIPE
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400 block mt-0.5">
                    {fipePrice > 0
                      ? `R$ ${fipePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'N/D'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Mês: {dto?.fipe?.reference_month || 'Atual'}
                  </span>
                </div>

                {/* Preço Anunciado */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                    Último Preço Anunciado
                  </span>
                  <span className="text-base sm:text-lg font-black text-amber-400 block mt-0.5">
                    {adPrice > 0
                      ? `R$ ${adPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Não registrado'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {latestAdWithPrice?.portal
                      ? `Portal: ${latestAdWithPrice.portal}`
                      : 'Bases Web'}
                    {adPrice > 0 && fipePrice > 0
                      ? ` • ${Math.round((adPrice / fipePrice) * 100)}% FIPE`
                      : ''}
                  </span>
                </div>

                {/* Quilometragem */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                    Último Odômetro
                  </span>
                  <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                    {latestKm > 0 ? `${Number(latestKm).toLocaleString('pt-BR')} km` : '0 km'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {dto?.ads_mileage?.mileage_records?.[0]?.source ||
                      latestAdWithPrice?.portal ||
                      'Registro de Vistoria'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remaining Tabs with styled dark wrapper */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'vehicle' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabVehicleData dto={dto} />
          </div>
        )}
        {activeTab === 'debts' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabDebts dto={dto} />
          </div>
        )}
        {activeTab === 'restrictions' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabRestrictions dto={dto} />
          </div>
        )}
        {activeTab === 'history' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabHistory dto={dto} />
          </div>
        )}
        {activeTab === 'fipe' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabFipePricing dto={dto} />
          </div>
        )}
        {activeTab === 'ads' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabAdsMileage dto={dto} />
          </div>
        )}
        {activeTab === 'technical' && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <TabTechnicalSpecs dto={dto} />
          </div>
        )}
      </div>
    </div>
  );
}
