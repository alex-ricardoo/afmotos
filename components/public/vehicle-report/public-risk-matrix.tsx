import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Gavel,
  Lock,
  Flame,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import type { PublicVehicleReportDto } from '@/lib/vehicle-lookup/share-types';

interface PublicRiskMatrixProps {
  report: PublicVehicleReportDto;
}

export function PublicRiskMatrix({ report }: PublicRiskMatrixProps) {
  const sum = report.risk_summary;

  const items = [
    {
      label: 'Roubo e Furto',
      clear: sum.theft_robbery_clear,
      clearText: 'Nada Consta',
      flaggedText: 'Alerta Ativo',
      icon: ShieldAlert,
      description: sum.theft_robbery_clear
        ? 'Sem queixa nas bases policiais.'
        : 'Consta queixa policial ativa.',
    },
    {
      label: 'Renajud / Judicial',
      clear: sum.judicial_clear,
      clearText: 'Sem Bloqueio',
      flaggedText: 'Bloqueio Ativo',
      icon: Gavel,
      description: sum.judicial_clear
        ? 'Sem ordens judiciais de penhora.'
        : 'Consta bloqueio no Renajud.',
    },
    {
      label: 'Gravame / Alienação',
      clear: sum.financial_clear,
      clearText: 'Sem Gravame',
      flaggedText: 'Gravame Ativo',
      icon: Lock,
      description: sum.financial_clear
        ? 'Livre de alienação financeira.'
        : report.gravamen_details?.agent
        ? `Financiamento: ${report.gravamen_details.agent}`
        : 'Gravame ativo cadastrado.',
    },
    {
      label: 'Leilão',
      clear: sum.auction_clear,
      clearText: 'Sem Passagem',
      flaggedText: 'Consta Leilão',
      icon: Flame,
      description: sum.auction_clear
        ? 'Nenhum registro de leilão.'
        : 'Passagem por leilão identificada.',
    },
    {
      label: 'Sinistro / Perda',
      clear: sum.accident_clear,
      clearText: 'Sem Sinistro',
      flaggedText: 'Consta Sinistro',
      icon: AlertTriangle,
      description: sum.accident_clear
        ? 'Sem indenização por perda.'
        : 'Registro de sinistro encontrado.',
    },
    {
      label: 'Débitos & Multas',
      clear: sum.debts_clear,
      clearText: 'Em Dia',
      flaggedText: 'Com Débitos',
      icon: Receipt,
      description: sum.debts_clear
        ? 'IPVA e multas em dia.'
        : report.debts_summary?.total_debts
        ? `Total de R$ ${report.debts_summary.total_debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
        : 'Constam débitos estaduais.',
    },
    {
      label: 'Recall de Fábrica',
      clear: sum.recall_clear,
      clearText: 'Sem Pendências',
      flaggedText: 'Pendente',
      icon: RotateCcw,
      description: sum.recall_clear
        ? 'Chamados atendidos ou sem recall.'
        : `${report.recalls_summary?.pending_count || 1} recall(s) pendente(s).`,
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
          Matriz de Riscos & Procedência
        </h3>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Verificação automatizada em 7 bases oficiais
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                item.clear
                  ? 'border-emerald-500/25 bg-emerald-950/15 hover:border-emerald-500/40'
                  : 'border-rose-500/35 bg-rose-950/25 hover:border-rose-500/50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      item.clear
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-slate-200 line-clamp-1">
                    {item.label}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug hidden md:block mb-2 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 mt-1">
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-center w-full ${
                    item.clear
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {item.clear ? item.clearText : item.flaggedText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
