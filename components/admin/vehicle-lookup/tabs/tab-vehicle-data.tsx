'use client';

import React from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Building2, ShieldAlert, CheckCircle2, Car } from 'lucide-react';

export function TabVehicleData({ dto }: { dto: InternalVehicleConsultationDto }) {
  const vd = dto.vehicle_data;
  const tech = dto.technical_specs;
  const raw = (dto.raw_response?.data || dto.raw_response || {}) as any;

  const isLocadora = Boolean(
    raw.registroEmLocadora?.registroEmLocadora === true ||
    raw.registro_locadora === true ||
    raw.registro_em_locadora === true ||
    /LOCADORA/i.test(JSON.stringify(dto.history?.previous_owners || ''))
  );

  const rawComVenda = String(
    raw.baseEstadual?.comunicacaoVenda ||
    raw.base_estadual?.comunicacao_venda ||
    raw.baseNacional?.indicadorComunicacaoVendas ||
    'NÃO CONSTA COMUNICAÇÃO DE VENDAS'
  ).trim();

  const hasComVenda = !rawComVenda.toUpperCase().includes('NAO CONSTA') &&
    !rawComVenda.toUpperCase().includes('NADA CONSTA') &&
    rawComVenda.toUpperCase() !== 'NAO';

  const vehicleStatus = String(
    raw.baseEstadual?.situacaoVeiculo ||
    raw.base_estadual?.situacao_veiculo ||
    raw.baseNacional?.situacaoVeiculo ||
    'CIRCULAÇÃO'
  ).trim();

  const dataFields = [
    { label: 'Placa', value: vd.plate, mono: true },
    { label: 'Chassi Completo', value: vd.chassis, mono: true },
    { label: 'Chassi Mascarado (LGPD)', value: vd.chassis_masked, mono: true },
    { label: 'Renavam', value: vd.renavam, mono: true },
    { label: 'Número do Motor', value: vd.engine_number, mono: true },
    { label: 'Marca', value: vd.brand },
    { label: 'Modelo', value: vd.model },
    { label: 'Versão / Acabamento', value: dto.summary.version || vd.model },
    { label: 'Tipo de Veículo', value: vd.vehicle_type },
    { label: 'Espécie', value: vd.species },
    { label: 'Combustível', value: vd.fuel },
    { label: 'Cilindrada', value: vd.displacement },
    { label: 'Potência', value: vd.power },
    { label: 'Cor Predominante', value: vd.color },
    { label: 'Ano Fabricação / Modelo', value: `${vd.year_manufacture || 'N/I'} / ${vd.year_model || 'N/I'}` },
    { label: 'Município / UF', value: `${vd.city} / ${vd.state}` },
    { label: 'Procedência', value: vd.origin || 'Nacional' },
    { label: 'Câmbio / Transmissão', value: tech.gearbox || 'Manual' },
    { label: 'Tração', value: tech.traction || 'Dianteira' },
    { label: 'Carroceria', value: tech.body_type || 'N/I' },
    { label: 'Capacidade de Passageiros', value: vd.seat_capacity ? `${vd.seat_capacity} passageiros` : 'N/I' },
  ];

  return (
    <div className="space-y-6">
      {/* Commercial & Transfer Status Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
          Status Comercial & Transferência
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Locadora */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isLocadora ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          }`}>
            <Building2 className="w-4 h-4" />
            Locadora: {isLocadora ? 'Consta Histórico em Locadora' : 'Não Consta'}
          </div>

          {/* Comunicacao de Venda */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            hasComVenda ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          }`}>
            <ShieldAlert className="w-4 h-4" />
            Comunicação de Venda: {hasComVenda ? 'Ativa' : 'Não Consta'}
          </div>

          {/* Situacao */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-muted/40 border-border text-foreground">
            <Car className="w-4 h-4 text-muted-foreground" />
            Situação: {vehicleStatus}
          </div>
        </div>
      </div>

      {/* Official Cadastral Data */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <h3 className="text-base font-bold text-foreground mb-4">Dados Cadastrais Oficiais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
          {dataFields.map((field, idx) => (
            <div key={idx} className="space-y-1 pb-3 border-b border-border/40">
              <div className="text-xs text-muted-foreground">{field.label}</div>
              <div className={`text-sm font-semibold text-foreground ${field.mono ? 'font-mono' : ''}`}>
                {field.value || 'Não informado'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
