'use client';

import React from 'react';
import {
  CheckCircle2,
  FileCheck2,
  Clock,
  RotateCw,
  XCircle,
  AlertTriangle,
  Undo2,
  CheckCheck,
  ChevronRight,
  Package,
} from 'lucide-react';
import { type AdminPaymentSummary } from '@/lib/admin/payments-service';

interface PaymentsKpiCardsProps {
  summary: AdminPaymentSummary;
  activeFilter?: string | null;
  onSelectFilter: (filterKey: string | null) => void;
}

export function PaymentsKpiCards({ summary, activeFilter, onSelectFilter }: PaymentsKpiCardsProps) {
  const cards = [
    {
      id: 'approved_consultations',
      title: 'Consultas Aprovadas',
      count: summary.totalApprovedConsultations,
      subtitle: 'Placas individuais pagas',
      icon: FileCheck2,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      bg: 'from-emerald-950/30 via-zinc-900/60 to-zinc-950 border-emerald-900/30 hover:border-emerald-500/40',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/40',
      filterKey: 'purpose:vehicle_consultation',
    },
    {
      id: 'approved_packages',
      title: 'Pacotes de Créditos',
      count: summary.totalApprovedPackages,
      subtitle: 'Pacotes veiculares B2B',
      icon: Package,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      bg: 'from-amber-950/30 via-zinc-900/60 to-zinc-950 border-amber-900/30 hover:border-amber-500/40',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/40',
      filterKey: 'purpose:credit_package',
    },
    {
      id: 'pending_grant',
      title: 'Pacotes Pendentes Liberação',
      count: summary.packagesPendingGrant,
      subtitle: 'Pago sem liberação de crédito',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
      bg: 'from-yellow-950/40 via-zinc-900/60 to-zinc-950 border-yellow-900/40 hover:border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.1)]',
      activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40 bg-yellow-950/50',
      filterKey: 'packages:pending_grant',
      hasAlert: summary.packagesPendingGrant > 0,
    },
    {
      id: 'completed',
      title: 'Laudos Concluídos',
      count: summary.totalReportsCompleted,
      subtitle: 'Entregues ao cliente com sucesso',
      icon: FileCheck2,
      color: 'text-[#e3c56c]',
      iconBg: 'bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30',
      bg: 'from-[#c9a44c]/15 via-zinc-900/60 to-zinc-950 border-[#c9a44c]/20 hover:border-[#c9a44c]/40',
      activeBorder: 'border-[#c9a44c] ring-2 ring-[#c9a44c]/30 bg-[#c9a44c]/20',
      filterKey: 'delivery:completed',
    },
    {
      id: 'insufficient_credits',
      title: 'Saldo API Brasil Esgotado',
      count: summary.totalInsufficientCredits,
      subtitle: 'HTTP 402 - Requer recarga',
      icon: AlertTriangle,
      color: 'text-red-400',
      iconBg: 'bg-red-500/20 text-red-400 border border-red-500/40',
      bg: 'from-red-950/40 via-zinc-900/60 to-zinc-950 border-red-900/40 hover:border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
      activeBorder: 'border-red-500 ring-2 ring-red-500/40 bg-red-950/50',
      filterKey: 'insufficient_credits',
      hasAlert: summary.totalInsufficientCredits > 0,
    },
    {
      id: 'failed_permanent',
      title: 'Falhas Permanentes',
      count: summary.totalPermanentFailures,
      subtitle: 'Consultas não entregues',
      icon: XCircle,
      color: 'text-rose-400',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      bg: 'from-rose-950/30 via-zinc-900/60 to-zinc-950 border-rose-900/30 hover:border-rose-500/40',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/40',
      filterKey: 'delivery:failed_permanent',
    },
    {
      id: 'processing',
      title: 'Em Processamento',
      count: summary.totalInProcessing,
      subtitle: 'Aguardando resposta do provedor',
      icon: Clock,
      color: 'text-sky-400',
      iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
      bg: 'from-sky-950/25 via-zinc-900/60 to-zinc-950 border-sky-900/30 hover:border-sky-500/40',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-950/40',
      filterKey: 'delivery:processing',
    },
    {
      id: 'retry',
      title: 'Retry Agendado',
      count: summary.totalRetryScheduled,
      subtitle: 'Tentativas automáticas em fila',
      icon: RotateCw,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      bg: 'from-amber-950/25 via-zinc-900/60 to-zinc-950 border-amber-900/30 hover:border-amber-500/40',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/40',
      filterKey: 'delivery:retry_scheduled',
    },
    {
      id: 'pending_refunds',
      title: 'Estornos Pendentes',
      count: summary.totalPendingRefunds,
      subtitle: 'Em análise ou retenção gateway',
      icon: Undo2,
      color: 'text-yellow-400',
      iconBg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      bg: 'from-yellow-950/25 via-zinc-900/60 to-zinc-950 border-yellow-900/30 hover:border-yellow-500/40',
      activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/30 bg-yellow-950/40',
      filterKey: 'refund:pending',
    },
    {
      id: 'confirmed_refunds',
      title: 'Estornos Confirmados',
      count: summary.totalConfirmedRefunds,
      subtitle: 'Devoluções integralmente pagas',
      icon: CheckCheck,
      color: 'text-zinc-300',
      iconBg: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
      bg: 'from-zinc-800/40 via-zinc-900/60 to-zinc-950 border-zinc-800 hover:border-zinc-700',
      activeBorder: 'border-zinc-400 ring-2 ring-zinc-400/30 bg-zinc-800/60',
      filterKey: 'refund:confirmed',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Visão Geral Operacional & Filtros Rápidos
        </span>
        {activeFilter && (
          <button
            type="button"
            onClick={() => onSelectFilter(null)}
            className="text-xs font-medium text-[#c9a44c] hover:underline cursor-pointer"
          >
            Limpar filtro ativo
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.filterKey;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectFilter(isSelected ? null : card.filterKey)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl border bg-gradient-to-b text-left transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                isSelected ? card.activeBorder : card.bg
              }`}
            >
              {/* Ping animado em caso de alerta */}
              {card.hasAlert && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}

              {/* Cabeçalho do Card com Ícone */}
              <div className="flex items-start justify-between w-full mb-3">
                <div className={`p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#c9a44c] text-black shadow-xs">
                    Ativo
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                )}
              </div>

              {/* Título e Contador */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {card.count}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200 mt-1 line-clamp-1 group-hover:text-white transition-colors">
                  {card.title}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{card.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
