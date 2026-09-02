import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVehicleConsultationsList } from '@/lib/queries/vehicle-lookup';
import { getVehicleLookupConfig } from '@/lib/vehicle-lookup/config';
import { VehicleLookupTabsClient } from '@/components/admin/vehicle-lookup/vehicle-lookup-tabs-client';

export const metadata: Metadata = {
  title: 'Consulta Veicular por Placa & Laudos',
  description:
    'Diagnóstico veicular completo para qualquer tipo de veículo com placa no território nacional (motos, carros, caminhões e utilitários) com snapshot JSONB, prevenção de dupla cobrança, cache pago e emissão de laudo em PDF.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminVehicleLookupPage() {
  const config = getVehicleLookupConfig();
  const { consultations, totalCount } = await getVehicleConsultationsList({ limit: 100 });

  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando painel de laudos...</div>}>
      <VehicleLookupTabsClient
        initialConsultations={consultations}
        totalCount={totalCount}
        isMockMode={config.mode === 'mock'}
      />
    </Suspense>
  );
}
