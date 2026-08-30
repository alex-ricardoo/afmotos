'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';

export function TabTechnicalSpecs({ dto }: { dto: InternalVehicleConsultationDto }) {
  const ts = dto.technical_specs;

  const specs = [
    { label: 'Câmbio / Marchas', value: ts.gearbox },
    { label: 'Tração', value: ts.traction },
    { label: 'Quantidade de Eixos', value: ts.axles ? `${ts.axles} eixos` : '2 eixos' },
    { label: 'Peso Bruto Total (PBT)', value: ts.gross_weight },
    { label: 'Capacidade Máxima de Tração (CMT)', value: ts.max_traction_capacity },
    { label: 'Tipo de Carroceria', value: ts.body_type },
    { label: 'Categoria', value: ts.category },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
      <h4 className="font-bold text-foreground text-base mb-4">Especificações de Engenharia e Estrutura</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
        {specs.map((item, idx) => (
          <div key={idx} className="space-y-1 pb-3 border-b border-border/40 text-xs">
            <div className="text-muted-foreground">{item.label}</div>
            <div className="text-sm font-semibold text-foreground">{item.value || 'Não informado'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
