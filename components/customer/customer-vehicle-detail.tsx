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
  FileText,
  Printer,
} from 'lucide-react';
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
  | 'summary'
  | 'vehicle'
  | 'debts'
  | 'restrictions'
  | 'history'
  | 'fipe'
  | 'ads'
  | 'technical';

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
  const formattedPlate = formatBrazilianPlate(consultation.plate);

  if (!dto) {
    return (
      <div className="space-y-6">
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white mb-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
          <span>Voltar para Minhas Consultas</span>
        </Link>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Consulta da Placa {formattedPlate}
          </h2>
          <p className="text-sm text-zinc-400">
            {consultation.status === 'pending'
              ? 'Esta consulta está aguardando a confirmação do pagamento para liberar o laudo completo.'
              : 'O relatório desta consulta está sendo processado. Aguarde alguns instantes.'}
          </p>

          {consultation.status === 'pending' && (
            <div className="pt-3">
              <Link href={`/cliente/pagamento/${consultation.id}`}>
                <Button className="h-12 px-7 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold rounded-xl shadow-lg shadow-[#c9a44c]/20">
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

  const s = dto.summary;
  const h = dto.history;
  const raw = (dto.raw_response?.data || dto.raw_response || {}) as any;

  const pendingRecalls = h.recalls ? h.recalls.filter((r) => r.status === 'PENDENTE') : [];
  const hasPendingRecall = pendingRecalls.length > 0;

  const isLocadora = Boolean(
    raw.registroEmLocadora?.registroEmLocadora === true ||
    raw.registro_locadora === true ||
    raw.registro_em_locadora === true ||
    /LOCADORA/i.test(JSON.stringify(h.previous_owners || ''))
  );

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
      <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-[#0e121a] via-[#0a0d14] to-[#07090f] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Laudo Oficial Emitido
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/25">
              <Sparkles className="w-3 h-3" />
              Base Senatran
            </span>
          </div>
        </div>

        {/* Main Identity Row: Plate, Title & Download Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Authentic Mercosul License Plate Graphic */}
            <div className="w-48 rounded-xl overflow-hidden shadow-xl border-2 border-zinc-600 bg-white select-none shrink-0">
              <div className="bg-[#003399] px-3 py-1 flex items-center justify-between text-white">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black">★</span>
                  <span className="text-[9px] font-black tracking-wider uppercase">MERCOSUL</span>
                </div>
                <span className="text-[10px] font-black tracking-widest">BRASIL</span>
                <div className="w-3.5 h-2 bg-[#009b3a] rounded-xs relative flex items-center justify-center overflow-hidden">
                  <div className="w-2 h-1.5 bg-[#fedf00] rotate-45" />
                  <div className="absolute w-1 h-1 bg-[#002776] rounded-full" />
                </div>
              </div>

              <div className="bg-white py-1.5 px-3 flex items-center justify-center relative">
                <span className="font-mono font-black text-2xl text-zinc-950 tracking-[0.22em] drop-shadow-xs">
                  {dto.plate_display || formattedPlate}
                </span>
                <span className="absolute bottom-0.5 right-2 text-[8px] font-bold text-zinc-400 font-mono">
                  BR
                </span>
              </div>
            </div>

            {/* Vehicle Title & Badges */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-heading leading-tight">
                <span className="text-[#c9a44c]">{s.brand}</span> {s.model}
              </h1>

              {s.version && (
                <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                  {s.version}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${riskConfig.bg} ${riskConfig.color}`}>
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

          {/* Action CTAs: Download PDF */}
          <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={pdfFilename}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-[#c9a44c]/20 inline-flex items-center justify-center gap-2.5 transition-all active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Baixar Laudo Oficial PDF</span>
            </a>
          </div>
        </div>

        {/* Vehicle Quick Specs Strip */}
        <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Ano Fab/Mod</span>
              <span className="font-bold text-white truncate block">{s.year_fab_mod || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Cor Oficial</span>
              <span className="font-bold text-white truncate block">{s.color || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#c9a44c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Local de Registro</span>
              <span className="font-bold text-white truncate block">{s.city_state || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Consultado em</span>
              <span className="font-bold text-white truncate block">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Segmented Pill Tabs Navigation */}
      <div className="bg-[#0b0e15] border border-zinc-800/80 p-1.5 rounded-2xl shadow-xl overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer select-none ${
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

      {/* Tab 1: Executive Resumo & Riscos */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Diagnostic & Risk Index Hero */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e131d] via-[#090c13] to-[#07090f] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Diagnóstico Geral de Procedência
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${riskConfig.bg} ${riskConfig.color}`}>
                    {riskConfig.title}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {s.risk_index} <span className="text-base sm:text-lg font-medium text-zinc-500">/ 100</span>
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

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {riskConfig.desc}
                </p>
              </div>

              {/* 3 Quick KPI Stat Blocks */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Débitos</span>
                  <span className={`text-base sm:text-lg font-black font-mono block ${s.has_debts ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {s.has_debts ? `R$ ${s.debts_total_amount.toFixed(2)}` : 'R$ 0,00'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {s.has_debts ? 'Com pendências' : 'Tudo Quitado'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Gravame</span>
                  <span className={`text-base sm:text-lg font-black block ${s.has_active_gravamen ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {s.has_active_gravamen ? 'Ativo' : 'Livre'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {s.has_active_gravamen ? 'Alienação' : 'Sem dívida'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Roubo/Furto</span>
                  <span className={`text-base sm:text-lg font-black block ${s.has_active_theft_robbery ? 'text-red-400' : 'text-emerald-400'}`}>
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
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_active_theft_robbery
                ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Roubo e Furto</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_active_theft_robbery ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.has_active_theft_robbery ? <XCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_active_theft_robbery ? 'text-red-400' : 'text-white'}`}>
                {s.has_active_theft_robbery ? 'Alerta Ativo de Roubo' : 'Sem Queixa de Roubo'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Base Nacional Integrada de Segurança (SINESP)
              </p>
            </div>

            {/* 2. Bloqueio Renajud */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_judicial_restriction
                ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bloqueio Renajud</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_judicial_restriction ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.has_judicial_restriction ? <AlertOctagon className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_judicial_restriction ? 'text-red-400' : 'text-white'}`}>
                {s.has_judicial_restriction ? 'Bloqueio Judicial Ativo' : 'Sem Bloqueios Judiciais'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Conselho Nacional de Justiça (CNJ)
              </p>
            </div>

            {/* 3. Alienação / Gravame */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_active_gravamen
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alienação / Gravame</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_active_gravamen ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.has_active_gravamen ? <AlertTriangle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_active_gravamen ? 'text-amber-400' : 'text-white'}`}>
                {s.has_active_gravamen ? 'Gravame Financeiro Ativo' : 'Veículo Desalienado'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Sistema Nacional de Gravames (SNG)
              </p>
            </div>

            {/* 4. Passagem por Leilão */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_auction_record
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Passagem por Leilão</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_auction_record ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.has_auction_record ? <AlertTriangle className="w-4 h-4" /> : <Gavel className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_auction_record ? 'text-amber-400' : 'text-white'}`}>
                {s.has_auction_record ? 'Consta Passagem em Leilão' : 'Sem Registro de Leilão'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Bases de Leiloeiros Oficiais do Brasil
              </p>
            </div>

            {/* 5. Registro de Sinistro */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_accident_indication
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Registro de Sinistro</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_accident_indication ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.has_accident_indication ? <AlertTriangle className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_accident_indication ? 'text-amber-400' : 'text-white'}`}>
                {s.has_accident_indication ? 'Consta Registro de Sinistro' : 'Sem Registro de Sinistro'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Indicações de avarias em seguradoras
              </p>
            </div>

            {/* 6. Recall de Fábrica */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              hasPendingRecall
                ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recall de Fábrica</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  hasPendingRecall ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {hasPendingRecall ? <Wrench className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${hasPendingRecall ? 'text-red-400' : 'text-white'}`}>
                {hasPendingRecall ? `${pendingRecalls.length} Recall Pendente` : 'Sem Pendências'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Sistema Nacional de Recalls (Senatran)
              </p>
            </div>

            {/* 7. Débitos & Multas */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              s.has_debts
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Débitos & Multas</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  s.has_debts ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-sm font-black ${s.has_debts ? 'text-amber-400' : 'text-white'}`}>
                {s.has_debts ? `Pendências: R$ ${s.debts_total_amount.toFixed(2)}` : 'Débitos Quitados'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                DETRAN Estadual e órgãos autuadores
              </p>
            </div>

            {/* 8. Uso em Locadora */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              isLocadora
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Uso em Locadora</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isLocadora ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {isLocadora ? <Building2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
              <div className={`text-sm font-black ${isLocadora ? 'text-amber-400' : 'text-white'}`}>
                {isLocadora ? 'Consta Registro em Locadora' : 'Não Consta Registro'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Histórico comercial e de frotas
              </p>
            </div>
          </div>
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
