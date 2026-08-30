'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { DollarSign, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function TabDebts({ dto }: { dto: InternalVehicleConsultationDto }) {
  const d = dto.debts;

  return (
    <div className="space-y-6">
      {/* Debts Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground">Total de Débitos</div>
          <div className="text-xl font-bold text-foreground mt-1">
            R$ {d.total_amount.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground">Multas Pendentes</div>
          <div className="text-xl font-bold text-foreground mt-1">
            R$ {d.fines_amount.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{d.fines_count} infrações</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground">IPVA Pendente</div>
          <div className="text-xl font-bold text-foreground mt-1">
            R$ {d.ipva_amount.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground">Licenciamento</div>
          <div className="text-xl font-bold text-foreground mt-1">
            R$ {d.licensing_amount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Fines List Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border/80">
          <h4 className="text-base font-bold text-foreground">Detalhamento de Multas e Infrações</h4>
        </div>
        {d.fines_list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Nenhuma multa ou autuação pendente registrada para este veículo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border/80">
                <tr>
                  <th className="px-5 py-3">Auto de Infração</th>
                  <th className="px-5 py-3">Descrição da Infração</th>
                  <th className="px-5 py-3">Órgão Autuador</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Valor (R$)</th>
                  <th className="px-5 py-3">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {d.fines_list.map((fine, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono font-semibold text-foreground">
                      {fine.auto_infraction || 'N/I'}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {fine.description || 'Infração de trânsito'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{fine.organ || 'DETRAN'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{fine.date || 'N/I'}</td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      R$ {Number(fine.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                        {fine.status || 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
