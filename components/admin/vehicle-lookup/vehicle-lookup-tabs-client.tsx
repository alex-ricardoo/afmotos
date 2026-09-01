'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { VehicleConsultationSummaryDto } from '@/lib/vehicle-lookup/types';
import { PlateSearchCard } from './plate-search-card';
import { RiskBadge, ModeBadge } from './consultation-badge';
import { MercosulPlateBadgeWeb } from './mercosul-plate-web';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Search,
  Database,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Layers,
  FileText,
  Eye,
  AlertCircle,
  Sparkles,
  Calendar,
  MapPin,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Loader2,
} from 'lucide-react';
import { createVehicleReportShareAction } from '@/lib/actions/vehicle-share';
import { VehicleShareModal } from './vehicle-share-modal';
import { toast } from 'sonner';

interface VehicleLookupTabsClientProps {
  initialConsultations: VehicleConsultationSummaryDto[];
  totalCount: number;
  isMockMode: boolean;
}

type TabType = 'consulta' | 'historico';

export function VehicleLookupTabsClient({
  initialConsultations,
  totalCount,
  isMockMode,
}: VehicleLookupTabsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab: TabType = searchParams.get('tab') === 'historico' ? 'historico' : 'consulta';

  // Filters for History Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedPointer, setSelectedPointer] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [generatingShareId, setGeneratingShareId] = useState<string | null>(null);
  const [modalShareUrl, setModalShareUrl] = useState<string | null>(null);
  const [modalPlateDisplay, setModalPlateDisplay] = useState<string>('');

  const handleShareFromTable = async (
    consultationId: string,
    plateDisplay: string,
    status: string,
    forceRevoke = false
  ) => {
    if (status !== 'COMPLETED') {
      toast.error('Apenas consultas concluídas possuem laudo compartilhável.');
      return;
    }

    try {
      setGeneratingShareId(consultationId);
      const res = await createVehicleReportShareAction({
        consultationId,
        forceRevokeExisting: forceRevoke,
      });

      if (!res.success) {
        if (res.hasActiveShareConflict) {
          const confirmRevoke = window.confirm(
            'Esta consulta já possui um link público ativo. Deseja revogar o link anterior e gerar um novo link de 30 dias?'
          );
          if (confirmRevoke) {
            await handleShareFromTable(consultationId, plateDisplay, status, true);
          }
          return;
        }
        toast.error(res.error || 'Erro ao gerar link de compartilhamento.');
        return;
      }

      if (res.data?.share_url) {
        setModalPlateDisplay(plateDisplay);
        setModalShareUrl(res.data.share_url);
        toast.success('Link do laudo gerado com sucesso!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao processar solicitação.');
    } finally {
      setGeneratingShareId(null);
    }
  };

  const handleTabChange = (tab: TabType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'historico') {
        params.set('tab', 'historico');
      } else {
        params.delete('tab');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // KPIs calculation
  const stats = useMemo(() => {
    const total = initialConsultations.length;
    const clear = initialConsultations.filter((c) => c.risk_level === 'LOW').length;
    const withAlerts = initialConsultations.filter(
      (c) =>
        c.risk_level === 'MEDIUM' ||
        c.risk_level === 'HIGH' ||
        c.risk_level === 'CRITICAL' ||
        c.has_active_gravamen ||
        c.has_auction_record ||
        c.has_accident_indication ||
        c.has_debts
    ).length;
    const economyReais = total * 29.9; // Estimativa média de custo de consulta veicular completa

    return { total, clear, withAlerts, economyReais };
  }, [initialConsultations]);

  // Client-side filtering
  const filteredConsultations = useMemo(() => {
    return initialConsultations.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.plate_display.toLowerCase().includes(term) ||
        item.plate_normalized.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        item.model.toLowerCase().includes(term) ||
        (item.city && item.city.toLowerCase().includes(term));

      const matchesRisk = selectedRisk === 'ALL' || item.risk_level === selectedRisk;
      const matchesMode = selectedMode === 'ALL' || item.mode === selectedMode;

      let matchesPointer = true;
      if (selectedPointer === 'GRAVAME') matchesPointer = item.has_active_gravamen;
      if (selectedPointer === 'LEILAO') matchesPointer = item.has_auction_record;
      if (selectedPointer === 'SINISTRO') matchesPointer = item.has_accident_indication;
      if (selectedPointer === 'DEBITOS') matchesPointer = item.has_debts;
      if (selectedPointer === 'ROUBO') matchesPointer = item.has_active_theft_robbery;

      return matchesSearch && matchesRisk && matchesMode && matchesPointer;
    });
  }, [initialConsultations, searchTerm, selectedRisk, selectedPointer, selectedMode]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground font-medium">Laudos Veiculares</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Consulta de Placa & Laudos
            </h1>
            <ModeBadge mode={isMockMode ? 'mock' : 'live'} isMock={isMockMode} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Diagnóstico veicular de procedência, débitos, gravames e histórico de leilão com cache instantâneo.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border/80 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => handleTabChange('consulta')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer select-none ${
              activeTab === 'consulta'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Nova Consulta
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('historico')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer select-none ${
              activeTab === 'historico'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            Histórico & Cache
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-muted font-bold">
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NOVA CONSULTA */}
      {/* ========================================================================= */}
      {activeTab === 'consulta' && (
        <div className="animate-in fade-in duration-200">
          <PlateSearchCard
            isMockMode={isMockMode}
            onNavigateToHistory={() => handleTabChange('historico')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO DE CONSULTAS & CACHE */}
      {/* ========================================================================= */}
      {activeTab === 'historico' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Total em Cache
                </div>
                <div className="text-xl sm:text-2xl font-black text-foreground">{stats.total}</div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Sem Restrições
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-500">{stats.clear}</div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Apontamentos / Alerta
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-500">{stats.withAlerts}</div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Economia Gerada
                </div>
                <div className="text-lg sm:text-xl font-black text-foreground">
                  R$ {stats.economyReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por placa, marca, modelo ou cidade..."
                  className="h-10 pl-10 text-xs rounded-xl border-border/80 bg-background"
                />
              </div>

              {/* Combined Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Risk Filter */}
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  aria-label="Filtrar por Nível de Risco"
                  className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">Todos os Riscos</option>
                  <option value="LOW">Risco Baixo (Verde)</option>
                  <option value="MEDIUM">Risco Médio (Âmbar)</option>
                  <option value="HIGH">Risco Alto (Laranja)</option>
                  <option value="CRITICAL">Risco Crítico (Vermelho)</option>
                </select>

                {/* Apontamentos Filter */}
                <select
                  value={selectedPointer}
                  onChange={(e) => setSelectedPointer(e.target.value)}
                  aria-label="Filtrar por Apontamento Específico"
                  className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">Todos os Apontamentos</option>
                  <option value="GRAVAME">Gravame Ativo</option>
                  <option value="LEILAO">Passagem por Leilão</option>
                  <option value="SINISTRO">Registro de Sinistro</option>
                  <option value="DEBITOS">Com Débitos Pendentes</option>
                  <option value="ROUBO">Queixa de Roubo/Furto</option>
                </select>

                {/* Modo Filter */}
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  aria-label="Filtrar por Modo do Gateway"
                  className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">Todos os Modos</option>
                  <option value="mock">Simulação (Mock)</option>
                  <option value="live">Oficial (Live)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE VIEW (< 768px): COMPACT VEHICLE CARDS (ZERO OVERFLOW TABELA) */}
          {/* ========================================================================= */}
          <div className="block md:hidden space-y-3">
            {filteredConsultations.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border/80 bg-card text-center text-muted-foreground space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground">Nenhuma consulta localizada</p>
                <p className="text-xs">Tente ajustar os filtros ou consulte uma nova placa.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTabChange('consulta')}
                  className="mt-2 rounded-xl text-xs font-bold gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Nova Consulta
                </Button>
              </div>
            ) : (
              filteredConsultations.map((c) => {
                const pointers: string[] = [];
                if (c.has_active_gravamen) pointers.push('Gravame Ativo');
                if (c.has_auction_record) pointers.push('Leilão');
                if (c.has_accident_indication) pointers.push('Sinistro');
                if (c.has_debts) pointers.push(`Débitos (R$ ${c.debts_total_amount.toFixed(0)})`);
                if (c.has_active_theft_robbery) pointers.push('Alerta Roubo');

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3"
                  >
                    {/* Header: Plate & Risk */}
                    <div className="flex items-center justify-between gap-2">
                      <MercosulPlateBadgeWeb plate={c.plate_display} size="sm" />
                      <div className="flex items-center gap-1.5">
                        <RiskBadge level={c.risk_level} />
                        <ModeBadge mode={c.mode} isMock={c.is_mock} />
                      </div>
                    </div>

                    {/* Vehicle Title */}
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {c.brand} {c.model}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>Ano: {c.year_manufacture || '-'}/{c.year_model || '-'}</span>
                        <span>•</span>
                        <span>Cor: {c.color || 'N/I'}</span>
                        <span>•</span>
                        <span>{c.city || 'Recife'}/{c.state || 'PE'}</span>
                      </div>
                    </div>

                    {/* Apontamentos Chips */}
                    {pointers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pointers.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Date & Direct Action Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs gap-2">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(c.consulted_at).toLocaleDateString('pt-BR')}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleShareFromTable(c.id, c.plate_display, c.status)
                          }
                          disabled={generatingShareId === c.id}
                          className="rounded-xl text-xs font-bold gap-1.5 h-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30 px-2.5"
                          title="Gerar ou Copiar Link Público"
                        >
                          {generatingShareId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                          <span>Link</span>
                        </Button>

                        <Link
                          href={`/admin/consulta-placa/${c.id}`}
                          className={buttonVariants({
                            size: 'sm',
                            className: 'rounded-xl text-xs font-bold gap-1.5 h-8 px-2.5',
                          })}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Laudo</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP VIEW (>= 768px): HIGH-END MODERN TABLE */}
          {/* ========================================================================= */}
          <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="px-5 py-3.5">Placa</th>
                    <th className="px-5 py-3.5">Veículo</th>
                    <th className="px-5 py-3.5">Localização</th>
                    <th className="px-5 py-3.5">Diagnóstico / Risco</th>
                    <th className="px-5 py-3.5">Apontamentos</th>
                    <th className="px-5 py-3.5">Data Consulta</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredConsultations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
                          <span className="font-semibold text-foreground">
                            Nenhum laudo encontrado com os filtros selecionados.
                          </span>
                          <span className="text-xs">Clique em "Nova Consulta" para pesquisar uma placa.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredConsultations.map((c) => {
                      const pointers: string[] = [];
                      if (c.has_active_gravamen) pointers.push('Gravame');
                      if (c.has_auction_record) pointers.push('Leilão');
                      if (c.has_accident_indication) pointers.push('Sinistro');
                      if (c.has_debts) pointers.push('Débitos');
                      if (c.has_active_theft_robbery) pointers.push('Roubo');

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          {/* Placa Badge */}
                          <td className="px-5 py-3.5">
                            <Link href={`/admin/consulta-placa/${c.id}`} className="inline-block">
                              <MercosulPlateBadgeWeb plate={c.plate_display} size="sm" />
                            </Link>
                          </td>

                          {/* Veiculo */}
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/consulta-placa/${c.id}`}
                              className="font-bold text-foreground hover:text-primary transition-colors block text-sm"
                            >
                              {c.brand} {c.model}
                            </Link>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Ano: {c.year_manufacture || '-'}/{c.year_model || '-'} • Cor: {c.color || 'N/I'}
                            </div>
                          </td>

                          {/* Localizacao */}
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {c.city ? `${c.city} - ${c.state || 'PE'}` : c.state || 'Brasil'}
                          </td>

                          {/* Risco */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <RiskBadge level={c.risk_level} />
                              <ModeBadge mode={c.mode} isMock={c.is_mock} />
                            </div>
                          </td>

                          {/* Apontamentos */}
                          <td className="px-5 py-3.5">
                            {pointers.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Nada Consta
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {pointers.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Data */}
                          <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                            {new Date(c.consulted_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          {/* Acao */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleShareFromTable(c.id, c.plate_display, c.status)
                                }
                                disabled={generatingShareId === c.id}
                                className="rounded-xl text-xs font-bold gap-1.5 h-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
                                title="Gerar ou Copiar Link Público"
                              >
                                {generatingShareId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                                <span>Link</span>
                              </Button>

                              <Link
                                href={`/admin/consulta-placa/${c.id}`}
                                className={buttonVariants({
                                  size: 'sm',
                                  className: 'rounded-xl text-xs font-bold gap-1.5 h-8',
                                })}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Laudo</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {modalShareUrl && (
        <VehicleShareModal
          isOpen={!!modalShareUrl}
          onClose={() => setModalShareUrl(null)}
          shareUrl={modalShareUrl}
          plateDisplay={modalPlateDisplay}
        />
      )}
    </div>
  );
}
