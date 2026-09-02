'use client';

import React, { useState } from 'react';
import type { PublicVehicleReportDto } from '@/lib/vehicle-lookup/share-types';
import { PublicReportHeader } from './public-report-header';
import { PublicPlateBadge } from './public-plate-badge';
import { PublicRiskMatrix } from './public-risk-matrix';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  Lock,
  History,
  Tag,
  Cpu,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Share2,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

interface PublicVehicleReportViewProps {
  report: PublicVehicleReportDto;
  shareToken: string;
  settings?: any;
}

type TabSection =
  | 'summary'
  | 'vehicle'
  | 'debts'
  | 'restrictions'
  | 'history'
  | 'fipe'
  | 'specs';

export function PublicVehicleReportView({
  report,
  shareToken,
  settings,
}: PublicVehicleReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabSection>('summary');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper for on-demand PDF download
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      toast.info('Gerando laudo em PDF institucional...');

      const pdfUrl = `/api/public/laudos/veicular/${shareToken}/pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      const cleanPlate = report.plate_display.replace(/[^a-zA-Z0-9]/g, '');
      link.download = `laudo-veicular_${cleanPlate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsDownloading(false);
        toast.success('Download do laudo concluído!');
      }, 1500);
    } catch (err) {
      setIsDownloading(false);
      toast.error('Erro ao baixar o laudo em PDF.');
    }
  };

  // Helper for quick share link copying
  const handleCopyShareLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Link do laudo copiado para a área de transferência!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      toast.error('Não foi possível copiar o link automaticamente.');
    }
  };

  // Helper for WhatsApp sharing
  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const message = `Olá! Confira o Laudo de Histórico e Procedência do veículo ${report.brand} ${report.model} (${report.plate_display}):\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  // Verdict state & styles
  const isApproved = report.procedural_verdict === 'APPROVED';
  const isAttention = report.procedural_verdict === 'ATTENTION';
  const isRestricted = report.procedural_verdict === 'RESTRICTED';

  // Compute structured alert items for warnings banner
  const warningItems: Array<{ text: string; icon: typeof AlertTriangle | typeof AlertCircle }> = [];

  if (report.gravamen_details?.has_active_gravamen) {
    warningItems.push({
      text: report.gravamen_details.agent
        ? `Gravame fiduciário ativo registrado no agente: ${report.gravamen_details.agent}.`
        : 'Gravame fiduciário ativo registrado em instituição financeira.',
      icon: AlertTriangle,
    });
  }

  if (report.owners_history?.records?.some((r) => r.document_type === 'PJ')) {
    warningItems.push({
      text: 'Veículo com histórico de titularidade anterior por Pessoa Jurídica / Locadora.',
      icon: AlertCircle,
    });
  }

  if (!report.risk_summary.debts_clear && report.debts_summary?.total_debts) {
    warningItems.push({
      text: `Constam pendências de débitos ou multas estaduais apuradas em R$ ${report.debts_summary.total_debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      icon: AlertTriangle,
    });
  }

  if (!report.risk_summary.auction_clear) {
    warningItems.push({
      text: 'Registro de passagem por base de leilão identificada.',
      icon: AlertTriangle,
    });
  }

  if (!report.risk_summary.judicial_clear) {
    warningItems.push({
      text: 'Consta restrição judicial Renajud ativa nas bases estaduais.',
      icon: AlertTriangle,
    });
  }

  if (!report.risk_summary.recall_clear) {
    warningItems.push({
      text: `${report.recalls_summary?.pending_count || 1} chamado(s) de recall de fábrica pendente(s) de atendimento.`,
      icon: AlertCircle,
    });
  }

  const tabs: Array<{
    key: TabSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'summary', label: 'Resumo Geral', icon: ShieldCheck },
    { key: 'vehicle', label: 'Dados do Veículo', icon: FileSpreadsheet },
    { key: 'debts', label: 'Débitos & Taxas', icon: DollarSign },
    { key: 'restrictions', label: 'Restrições & Gravames', icon: Lock },
    { key: 'history', label: 'Histórico & Donos', icon: History },
    { key: 'fipe', label: 'Preço & FIPE', icon: Tag },
    { key: 'specs', label: 'Ficha Técnica', icon: Cpu },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 md:pb-6">
      {/* 1. Header with brand & actions */}
      <PublicReportHeader
        shareToken={shareToken}
        plateDisplay={report.plate_display}
        settings={settings}
        isDownloading={isDownloading}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Mock Simulation Alert Banner */}
      {report.is_mock && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-3.5 flex items-center gap-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="leading-snug">
            <span className="font-bold">Ambiente de Demonstração (Mock):</span> Este relatório é uma simulação gerada para validação institucional e homologação.
          </p>
        </div>
      )}

      {/* 2. Vehicle Identification Hero Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <PublicPlateBadge
            plate={report.plate_display}
            className="shrink-0 self-start sm:self-auto shadow-md"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span>{report.vehicle_type || 'VEÍCULO'}</span>
              <span>•</span>
              <span>{report.fuel || 'FLEX'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {report.brand} {report.model}
            </h2>
            {report.version && (
              <p className="text-xs sm:text-sm text-slate-400">{report.version}</p>
            )}
          </div>
        </div>

        {/* Clean Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-medium text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              Ano: <strong className="text-white">{report.year_manufacture || '—'}/{report.year_model || '—'}</strong>
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-medium text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-200">{report.city_state || 'Brasil'}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-medium text-slate-300">
            <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              Consultado em: <strong className="text-slate-200">{new Date(report.consulted_at).toLocaleDateString('pt-BR')}</strong>
            </span>
          </div>
        </div>

        {/* 3. Provenance & Warnings Banner */}
        {isApproved ? (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-3.5 sm:p-4 text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-emerald-200">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Veículo com Procedência Regular (Sem Apontamentos de Risco)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-7">
              {report.verdict_description ||
                'Nenhum alerta de roubo/furto, bloqueio judicial ou sinistro foi detectado nas bases consultadas.'}
            </p>
          </div>
        ) : (
          <div
            className={`rounded-xl border p-3.5 sm:p-4 space-y-2.5 ${
              isRestricted
                ? 'border-rose-500/40 bg-rose-950/25 text-rose-200'
                : 'border-amber-500/35 bg-amber-950/20 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-white">
                {isRestricted ? (
                  <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                )}
                <span>{report.verdict_label || 'Apontamentos Identificados'}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isRestricted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isRestricted ? 'RESTRITO' : 'APONTAMENTOS'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {report.verdict_description}
            </p>

            {/* Direct Structured Warning Items */}
            {warningItems.length > 0 ? (
              <ul className="space-y-1.5 pt-1 text-xs border-t border-slate-800/60">
                {warningItems.map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <li key={idx} className="flex items-start gap-2 text-slate-200">
                      <ItemIcon className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : report.verdict_bullets && report.verdict_bullets.length > 0 ? (
              <ul className="space-y-1.5 pt-1 text-xs border-t border-slate-800/60">
                {report.verdict_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Responsive Tabs Navigation with Scroll Mask */}
      <div className="relative border-b border-slate-800 print:hidden">
        <div className="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap pb-px touch-pan-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        {/* Visual Right Gradient Mask to signal scrollability on mobile */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent md:hidden" />
      </div>

      {/* 5. Tab Contents */}
      <div className="space-y-6">
        {/* Tab 1: Resumo Geral & Matriz de Riscos */}
        {(activeTab === 'summary' || typeof window === 'undefined') && (
          <div className="space-y-6">
            <PublicRiskMatrix report={report} />
          </div>
        )}

        {/* Tab 2: Dados do Veículo */}
        {activeTab === 'vehicle' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Dados Cadastrais do Veículo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Marca / Modelo</span>
                <p className="font-semibold text-white">{report.brand} {report.model}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Ano Fabricação / Modelo</span>
                <p className="font-semibold text-white">{report.year_manufacture || '—'} / {report.year_model || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Cor Predominante</span>
                <p className="font-semibold text-white uppercase">{report.color || 'Não informada'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Combustível</span>
                <p className="font-semibold text-white">{report.fuel || 'Não informado'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Cilindradas / Potência</span>
                <p className="font-semibold text-white">{report.displacement || report.engine_capacity || '—'} / {report.power || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Município / UF Emplacamento</span>
                <p className="font-semibold text-white">{report.city_state || 'Não informado'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Chassi (Mascarado por Privacidade)</span>
                <p className="font-mono font-semibold text-emerald-400">{report.chassis_masked || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">RENAVAM (Mascarado por Privacidade)</span>
                <p className="font-mono font-semibold text-emerald-400">{report.renavam_masked || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Motor (Mascarado)</span>
                <p className="font-mono font-semibold text-emerald-400">{report.engine_masked || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Débitos & Taxas */}
        {activeTab === 'debts' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Situação de Débitos e Multas Estaduais
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Total de Débitos</span>
                <p className="text-base sm:text-lg font-bold text-white">
                  R$ {(report.debts_summary?.total_debts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">IPVA Pendente</span>
                <p className="font-semibold text-slate-200">
                  R$ {(report.debts_summary?.ipva_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Licenciamento</span>
                <p className="font-semibold text-slate-200">
                  R$ {(report.debts_summary?.licensing_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-1">
                <span className="text-slate-500">Multas ({report.debts_summary?.fines_count || 0})</span>
                <p className="font-semibold text-slate-200">
                  R$ {(report.debts_summary?.fines_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Restrições & Gravames */}
        {activeTab === 'restrictions' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Restrições, Gravames e Alienação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Gravame Financeiro</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.gravamen_details?.has_active_gravamen
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {report.gravamen_details?.status_label || 'Sem Gravame'}
                  </span>
                </div>
                {report.gravamen_details?.agent && (
                  <p className="text-slate-400 text-[11px]">
                    Agente Financeiro: {report.gravamen_details.agent}
                  </p>
                )}
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Restrição Renajud</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.risk_summary.judicial_clear
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {report.risk_summary.judicial_clear ? 'Nada Consta' : 'Bloqueio Ativo'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {report.gravamen_details?.judicial_restriction ||
                    'Sem restrições judiciais informadas nas bases consultadas.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Histórico & Donos */}
        {activeTab === 'history' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Histórico de Proprietários e Registros Anteriores
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total de Proprietários Registrados</span>
                <span className="font-bold text-white text-sm">
                  {report.owners_history?.owners_count || 1}
                </span>
              </div>

              {report.owners_history?.records && report.owners_history.records.length > 0 ? (
                <div className="space-y-2">
                  {report.owners_history.records.map((owner, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">
                          {idx + 1}º Proprietário ({owner.document_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'})
                        </span>
                        <p className="text-[11px] text-slate-500">Documento: {owner.masked_document}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">
                        <span>{owner.state ? `UF: ${owner.state}` : ''}</span>
                        {owner.period && <p className="text-slate-500">{owner.period}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Sem detalhamento adicional de proprietários anteriores nas bases consultadas.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Preço & FIPE */}
        {activeTab === 'fipe' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Tabela FIPE & Referência de Mercado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500">Valor FIPE de Referência</span>
                <p className="text-2xl font-black text-emerald-400">
                  R$ {(report.fipe_reference?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Mês de referência: {report.fipe_reference?.reference_month || 'Atual'} • Código: {report.fipe_reference?.code || '—'}
                </p>
              </div>

              {report.latest_km_record && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Último Odômetro / Registro de Km</span>
                  <p className="text-2xl font-black text-white">
                    {report.latest_km_record.mileage.toLocaleString('pt-BR')} km
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Fonte: {report.latest_km_record.source || 'Histórico'} {report.latest_km_record.date ? `(${report.latest_km_record.date})` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Ficha Técnica */}
        {activeTab === 'specs' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Ficha Técnica & Configuração
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                <span className="text-slate-500">Câmbio / Marchas</span>
                <p className="font-semibold text-white">{report.gearbox || 'Manual'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                <span className="text-slate-500">Tração</span>
                <p className="font-semibold text-white">{report.traction || 'Traseira'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                <span className="text-slate-500">Carroceria / Espécie</span>
                <p className="font-semibold text-white">{report.body_type || report.species || 'Normal'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                <span className="text-slate-500">Capacidade de Ocupantes</span>
                <p className="font-semibold text-white">{report.seat_capacity || 2} passageiros</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                <span className="text-slate-500">Procedência</span>
                <p className="font-semibold text-white">{report.origin || 'Nacional'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Quick Share Section */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 print:hidden">
        <div className="text-center sm:text-left space-y-0.5">
          <span className="text-xs font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            Compartilhar este Laudo
          </span>
          <p className="text-[11px] text-slate-400">
            Envie este link interativo ou baixe o laudo em PDF para comprovar procedência e valorizar o veículo na negociação.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareLink}
            className="flex-1 sm:flex-none gap-1.5 text-xs bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 h-9"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Link Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Link</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none gap-1.5 text-xs bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold h-9 shadow-md"
          >
            <WhatsAppIcon className="h-4 w-4 fill-slate-950" />
            <span>WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* 7. Institutional Legal Disclaimer */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-[11px] text-slate-500 space-y-2 leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-slate-400">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Aviso Legal & Termo de Limitações</span>
        </div>
        <p>{report.disclaimer}</p>
        <p className="text-[10px] text-slate-600 border-t border-slate-800/60 pt-2">
          Emitido por: {report.issuer.company_name} ({report.issuer.trade_name}) • CNPJ: {report.issuer.cnpj} • {report.issuer.city}/{report.issuer.state}. Documento autenticado eletronicamente por chave única.
        </p>
      </div>

      {/* 8. Sticky Bottom Bar on Mobile (< 768px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 shadow-2xl print:hidden">
        <Button
          type="button"
          size="default"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-11 shadow-lg shadow-emerald-950/50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gerando Laudo em PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>📥 Baixar Laudo Oficial Completo (PDF)</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
