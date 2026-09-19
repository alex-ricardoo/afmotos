'use client';

import React from 'react';
import {
  Search,
  CreditCard,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useVehicleHistory } from './vehicle-history-context';
import { StepList, StepItem } from './step-list';

interface VehicleHistoryHowItWorksProps {
  siteName?: string;
}

const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    stepLabel: 'Passo 1',
    badge: '30 segundos',
    title: 'Digite a Placa no Site',
    description:
      'Informe a placa do veículo no início da página. O sistema valida os dados e prepara sua consulta em tempo real.',
    icon: Search,
    pill: 'Validação instantânea',
  },
  {
    number: '02',
    stepLabel: 'Passo 2',
    badge: 'Mercado Pago Oficial',
    title: 'Checkout Seguro Mercado Pago',
    description:
      'Pague com total segurança no ambiente oficial do Mercado Pago via Pix instantâneo, Cartão de Crédito em até 12x, Débito Caixa ou Saldo Mercado Pago.',
    icon: CreditCard,
    pill: 'Pix, Cartão até 12x, Débito & Saldo MP',
  },
  {
    number: '03',
    stepLabel: 'Passo 3',
    badge: 'Plataforma Vitalícia',
    title: 'Laudos Salvos & PDF para Imprimir',
    description:
      'Acesse sua Área do Cliente exclusiva onde todos os seus laudos ficam salvos para sempre. Consulte múltiplos veículos a qualquer momento e baixe o laudo oficial em PDF.',
    icon: FileCheck,
    pill: 'Múltiplas consultas & PDF oficial',
  },
];

/**
 * VehicleHistoryHowItWorks - Seção Como Funciona
 * Refatorada para mobile-first com StepList vertical e acabamento premium.
 */
export function VehicleHistoryHowItWorks({
  siteName = 'AF Veículos PE',
}: VehicleHistoryHowItWorksProps = {}) {
  const { scrollToSection } = useVehicleHistory();

  return (
    <section className="py-12 sm:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden">
      {/* Ambient background glow sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simples, Rápido & Sem Burocracia</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-50 tracking-tight font-heading">
            Como funciona em 3 passos
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Consulte qualquer veículo no Brasil e receba o diagnóstico oficial da {siteName}{' '}
            diretamente no seu celular em minutos.
          </p>
        </div>

        {/* Lista Vertical de Passos com Indicadores Circulares Minimalistas */}
        <StepList steps={HOW_IT_WORKS_STEPS} />

        {/* Chamada de Valor na Negociação */}
        <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/40 pr-14 sm:pr-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-50">
                  Diferencial na Compra e Venda de Veículos
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                  Ter o laudo oficial em PDF e o link interativo guardados{' '}
                  <strong className="text-amber-400">comprova procedência</strong>, afasta
                  compradores desconfiados e{' '}
                  <strong className="text-slate-200">valoriza seu veículo</strong> para fechar negócio
                  pelo preço justo!
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-howitworks-consultar"
              onClick={() => scrollToSection('consulta-placa')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-transform duration-150 shadow-md shadow-blue-900/30 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <span>Consultar Placa</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
