import { Metadata } from 'next';
import { getVehicleConsultationsList } from '@/lib/queries/vehicle-lookup';
import { getVehicleLookupConfig } from '@/lib/vehicle-lookup/config';
import { PlateSearchCard } from '@/components/admin/vehicle-lookup/plate-search-card';
import { ConsultationHistoryTable } from '@/components/admin/vehicle-lookup/consultation-history-table';
import { ShieldCheck, Database, FileCheck, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Consulta de Placa & Histórico Veicular | Painel AF Motos',
  description:
    'Diagnóstico veicular completo por placa com snapshot JSONB, prevenção de dupla cobrança, cache pago e emissão de laudo em PDF.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminVehicleLookupPage() {
  const config = getVehicleLookupConfig();
  const { consultations, totalCount } = await getVehicleConsultationsList({ limit: 100 });

  // Quick stats
  const totalCached = consultations.length;
  const criticalCount = consultations.filter((c) => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH').length;
  const clearCount = consultations.filter((c) => c.risk_level === 'LOW').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>Admin</span>
          <span>/</span>
          <span className="text-foreground font-medium">Consulta de Placa</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Consulta de Placa & Laudos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consulta veicular completa (dados cadastrais, multas, débitos, gravames, restrições e FIPE) com cache permanente.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Laudos em Cache</div>
            <div className="text-xl font-bold text-foreground">{totalCached}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Sem Restrições</div>
            <div className="text-xl font-bold text-foreground">{clearCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Alto Risco / Alertas</div>
            <div className="text-xl font-bold text-foreground">{criticalCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Modo do Gateway</div>
            <div className="text-sm font-bold text-foreground uppercase tracking-wide">
              {config.mode === 'mock' ? 'Simulação (Mock)' : 'Oficial (Live)'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Search Card with Cache Check */}
      <PlateSearchCard isMockMode={config.mode === 'mock'} />

      {/* History Table */}
      <ConsultationHistoryTable
        initialConsultations={consultations}
        totalCount={totalCount}
      />
    </div>
  );
}
