'use client';

import React, { useState } from 'react';
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
  Code2,
  ArrowLeft,
  Download,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import type { ConsultationDetail } from '@/lib/customer/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { RiskBadge, ModeBadge, StatusBadge } from '@/components/admin/vehicle-lookup/consultation-badge';
import { TabSummary } from '@/components/admin/vehicle-lookup/tabs/tab-summary';
import { TabVehicleData } from '@/components/admin/vehicle-lookup/tabs/tab-vehicle-data';
import { TabDebts } from '@/components/admin/vehicle-lookup/tabs/tab-debts';
import { TabRestrictions } from '@/components/admin/vehicle-lookup/tabs/tab-restrictions';
import { TabHistory } from '@/components/admin/vehicle-lookup/tabs/tab-history';
import { TabFipePricing } from '@/components/admin/vehicle-lookup/tabs/tab-fipe-pricing';
import { TabAdsMileage } from '@/components/admin/vehicle-lookup/tabs/tab-ads-mileage';
import { TabTechnicalSpecs } from '@/components/admin/vehicle-lookup/tabs/tab-technical-specs';
import { TabRawJson } from '@/components/admin/vehicle-lookup/tabs/tab-raw-json';

interface CustomerVehicleDetailProps {
  consultation: ConsultationDetail;
  dto: InternalVehicleConsultationDto | null;
}

type TabKey =
  | 'summary'
  | 'vehicle'
  | 'debts'
  | 'restrictions'
  | 'history'
  | 'fipe'
  | 'ads'
  | 'technical'
  | 'json';

export function CustomerVehicleDetail({
  consultation,
  dto,
}: CustomerVehicleDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

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
    { key: 'json', label: 'JSON Técnico', icon: Code2 },
  ];

  const formattedDate = new Date(
    consultation.processed_at || consultation.created_at
  ).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pdfDownloadUrl = `/api/cliente/consultas/${consultation.id}/pdf`;
  const pdfFilename = `laudo-veicular_${consultation.plate_normalized}_${consultation.id.slice(0, 8)}.pdf`;

  if (!dto) {
    return (
      <div className="space-y-6">
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Minhas Consultas
        </Link>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">
            Consulta da Placa {consultation.plate}
          </h2>
          <p className="text-sm text-zinc-400">
            {consultation.status === 'pending'
              ? 'Esta consulta está aguardando confirmação do pagamento para liberar o laudo completo.'
              : 'O relatório desta consulta está sendo processado. Aguarde alguns instantes.'}
          </p>

          {consultation.status === 'pending' && (
            <div className="pt-2">
              <Link href={`/cliente/pagamento/${consultation.id}`}>
                <Button className="bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold rounded-xl px-6">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ir para Pagamento
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header card identical to admin layout */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/cliente/consultas"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Minhas Consultas
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {dto.plate_display}
              </h1>
              <span className="text-xl sm:text-2xl font-bold text-zinc-600">•</span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                {dto.summary.brand} {dto.summary.model}
              </h2>
              <RiskBadge level={dto.summary.risk_level} />
              <ModeBadge mode={dto.mode} isMock={dto.is_mock} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2">
              <span>
                Versão: <strong className="text-zinc-200">{dto.summary.version || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Ano: <strong className="text-zinc-200">{dto.summary.year_fab_mod || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Cor: <strong className="text-zinc-200">{dto.summary.color || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Local: <strong className="text-zinc-200">{dto.summary.city_state || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Consultado em: <strong className="text-zinc-200">{formattedDate}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={pdfFilename}
              className={buttonVariants({
                className:
                  'rounded-xl text-xs font-bold gap-2 h-11 px-5 shadow-lg bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 transition-transform active:scale-95',
              })}
            >
              <Download className="w-4 h-4" />
              Baixar Laudo PDF
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Navigation identical to admin */}
      <div className="border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  isActive
                    ? 'border-[#c9a44c] text-[#c9a44c] bg-[#c9a44c]/5 font-bold shadow-xs'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#c9a44c]' : 'text-zinc-400'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'summary' && <TabSummary dto={dto} />}
        {activeTab === 'vehicle' && <TabVehicleData dto={dto} />}
        {activeTab === 'debts' && <TabDebts dto={dto} />}
        {activeTab === 'restrictions' && <TabRestrictions dto={dto} />}
        {activeTab === 'history' && <TabHistory dto={dto} />}
        {activeTab === 'fipe' && <TabFipePricing dto={dto} />}
        {activeTab === 'ads' && <TabAdsMileage dto={dto} />}
        {activeTab === 'technical' && <TabTechnicalSpecs dto={dto} />}
        {activeTab === 'json' && <TabRawJson dto={dto} />}
      </div>
    </div>
  );
}
