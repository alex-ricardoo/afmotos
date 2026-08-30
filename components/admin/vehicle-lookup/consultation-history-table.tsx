'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { VehicleConsultationSummaryDto } from '@/lib/vehicle-lookup/types';
import { RiskBadge, ModeBadge, StatusBadge } from './consultation-badge';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Search, FileText, ArrowUpDown, Filter, Eye, AlertCircle } from 'lucide-react';

interface ConsultationHistoryTableProps {
  initialConsultations: VehicleConsultationSummaryDto[];
  totalCount: number;
}

export function ConsultationHistoryTable({
  initialConsultations,
  totalCount,
}: ConsultationHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');

  // Client-side filtering on initial loaded set
  const filteredConsultations = initialConsultations.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.plate_display.toLowerCase().includes(term) ||
      item.brand.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      (item.city && item.city.toLowerCase().includes(term));

    const matchesRisk = selectedRisk === 'ALL' || item.risk_level === selectedRisk;
    const matchesMode = selectedMode === 'ALL' || item.mode === selectedMode;

    return matchesSearch && matchesRisk && matchesMode;
  });

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Histórico de Consultas ({totalCount})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Snapshots veiculares salvos no banco local da AF Motos. Reutilização a custo zero.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por placa, marca..."
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background border border-input text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Todos os Riscos</option>
            <option value="LOW">Risco Baixo</option>
            <option value="MEDIUM">Risco Médio</option>
            <option value="HIGH">Risco Alto</option>
            <option value="CRITICAL">Risco Crítico</option>
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background border border-input text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Todos os Modos</option>
            <option value="mock">Simulação (Mock)</option>
            <option value="live">Oficial (Live)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b border-border/80">
            <tr>
              <th className="px-5 py-3.5">Placa</th>
              <th className="px-5 py-3.5">Veículo</th>
              <th className="px-5 py-3.5">Localização</th>
              <th className="px-5 py-3.5">Avaliação de Risco</th>
              <th className="px-5 py-3.5">Apontamentos</th>
              <th className="px-5 py-3.5">Modo & Status</th>
              <th className="px-5 py-3.5">Data da Consulta</th>
              <th className="px-5 py-3.5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredConsultations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
                    <span className="font-medium">Nenhuma consulta encontrada com os filtros aplicados.</span>
                    <span className="text-xs">Digite uma placa no topo para iniciar uma nova consulta.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredConsultations.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  {/* Plate */}
                  <td className="px-5 py-4 font-mono font-bold text-foreground">
                    <Link
                      href={`/admin/consulta-placa/${c.id}`}
                      className="hover:text-primary transition-colors inline-block"
                    >
                      {c.plate_display}
                    </Link>
                  </td>

                  {/* Vehicle */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-foreground">
                      {c.brand} {c.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ano: {c.year_manufacture || 'N/I'}/{c.year_model || 'N/I'} • {c.vehicle_type || 'MOTO'}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {c.city ? `${c.city} - ${c.state || 'SP'}` : c.state || 'Brasil'}
                  </td>

                  {/* Risk Badge */}
                  <td className="px-5 py-4">
                    <RiskBadge level={c.risk_level} />
                  </td>

                  {/* Alerts / Flags */}
                  <td className="px-5 py-4 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {c.has_active_theft_robbery && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 font-bold">
                          Roubo/Furto
                        </span>
                      )}
                      {c.has_judicial_restriction && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 font-bold">
                          Renajud
                        </span>
                      )}
                      {c.has_active_gravamen && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-semibold">
                          Gravame
                        </span>
                      )}
                      {c.has_auction_record && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 font-semibold">
                          Leilão
                        </span>
                      )}
                      {c.has_debts && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          Débitos: R$ {c.debts_total_amount.toFixed(2)}
                        </span>
                      )}
                      {!c.has_active_theft_robbery &&
                        !c.has_judicial_restriction &&
                        !c.has_active_gravamen &&
                        !c.has_auction_record &&
                        !c.has_debts && (
                          <span className="text-emerald-500 font-medium">Sem pendências</span>
                        )}
                    </div>
                  </td>

                  {/* Mode & Status */}
                  <td className="px-5 py-4 space-y-1">
                    <ModeBadge mode={c.mode} isMock={c.is_mock} />
                    <div>
                      <StatusBadge status={c.status} />
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.consulted_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/consulta-placa/${c.id}`}
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                        className: 'rounded-xl text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground',
                      })}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Laudo
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
