'use client';

import React from 'react';
import Link from 'next/link';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import type { ConsultationDetail, ConsultationStatus } from '@/lib/customer/types';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Car,
  FileText,
  Calendar,
  MapPin,
  Fuel,
  Info,
  CreditCard,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsultationDetailsProps {
  consultation: ConsultationDetail;
}

export function ConsultationDetails({ consultation }: ConsultationDetailsProps) {
  const formattedPlate = formatBrazilianPlate(consultation.plate);

  const rawData = (consultation.vehicle_data || {}) as Record<string, any>;
  const basic = rawData.dadosBasicosDoVeiculo || rawData.dados || {};
  const nacional = rawData.baseNacional || {};
  const estadual = rawData.baseEstadual || {};
  const fipe = rawData.fipe || rawData.dadosFipe || {};

  const brand = basic.marca || rawData.marca || 'N/D';
  const model = basic.modelo || rawData.modelo || 'N/D';
  const yearFab = basic.ano_fabricacao || basic.anoFabricacao || rawData.ano_fabricacao || '—';
  const yearMod = basic.ano_modelo || basic.anoModelo || rawData.ano_modelo || '—';
  const color = basic.cor || rawData.cor || '—';
  const fuel = basic.combustivel || rawData.combustivel || '—';
  const city = basic.municipio || rawData.municipio || '—';
  const state = basic.uf || rawData.uf || '—';
  const chassi = basic.chassi || rawData.chassi ? '••••••••' + String(basic.chassi || rawData.chassi).slice(-4) : '—';
  const renavam = basic.renavam || rawData.renavam ? '••••••••' + String(basic.renavam || rawData.renavam).slice(-4) : '—';

  // Risk indicators
  const leilao = rawData.leilao || rawData.sinistro;
  const hasLeilao = Boolean(leilao && (leilao.quantidade > 0 || leilao.consta));

  const multas = rawData.multas || estadual.multas;
  const hasMultas = Boolean(multas && multas.length > 0);

  const rouboFurto = rawData.roubo_furto || basic.situacao_veiculo;
  const isRouboFurto = String(rouboFurto || '').toLowerCase().includes('roubo') || String(rouboFurto || '').toLowerCase().includes('furto');

  const renajud = rawData.renajud || rawData.restricoes_judiciais;
  const hasRenajud = Boolean(renajud && renajud.length > 0);

  const gravame = rawData.gravame || basic.gravame;
  const hasGravame = Boolean(gravame && !String(gravame).toLowerCase().includes('nada'));

  const formattedDate = new Date(consultation.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/cliente/consultas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Minhas Consultas</span>
        </Link>

        <div className="flex items-center gap-2">
          {consultation.status === 'pending' && (
            <Link href={`/cliente/pagamento/${consultation.id}`}>
              <Button size="sm" className="h-9 px-4 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl">
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                <span>Pagar e Liberar Laudo</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Vehicle Header Card */}
      <div className="relative rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#c9a44c] shrink-0">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-sm text-white tracking-wider">
                  {formattedPlate}
                </span>
                <span className="text-xs text-zinc-400 font-medium">Consultado em {formattedDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                {[brand, model].filter((x) => x !== 'N/D').join(' ') || 'Veículo Consultado'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Ano Fab/Mod: <strong className="text-zinc-200">{yearFab}/{yearMod}</strong> • Cor:{' '}
                <strong className="text-zinc-200">{color}</strong> • Combustível:{' '}
                <strong className="text-zinc-200">{fuel}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 border-t md:border-t-0 border-zinc-800/80 pt-4 md:pt-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Laudo Oficial Gerado</span>
            </div>
            <span className="text-[11px] text-zinc-400">ID da consulta: {consultation.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Safety & Risk Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Leilão */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${hasLeilao ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
          {hasLeilao ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400 font-medium">Leilão / Sinistro</p>
            <p className={`text-xs font-bold ${hasLeilao ? 'text-amber-400' : 'text-zinc-200'}`}>
              {hasLeilao ? 'Consta Registro' : 'Nada Consta'}
            </p>
          </div>
        </div>

        {/* Roubo / Furto */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isRouboFurto ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
          {isRouboFurto ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400 font-medium">Roubo / Furto</p>
            <p className={`text-xs font-bold ${isRouboFurto ? 'text-red-400' : 'text-zinc-200'}`}>
              {isRouboFurto ? 'Alerta Ativo' : 'Sem Alerta Ativo'}
            </p>
          </div>
        </div>

        {/* Renajud */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${hasRenajud ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
          {hasRenajud ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400 font-medium">Restrição Renajud</p>
            <p className={`text-xs font-bold ${hasRenajud ? 'text-amber-400' : 'text-zinc-200'}`}>
              {hasRenajud ? 'Consta Restrição' : 'Nada Consta'}
            </p>
          </div>
        </div>

        {/* Multas / Débitos */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${hasMultas ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
          {hasMultas ? (
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400 font-medium">Débitos / Multas</p>
            <p className={`text-xs font-bold ${hasMultas ? 'text-yellow-400' : 'text-zinc-200'}`}>
              {hasMultas ? 'Constam Débitos' : 'Sem Débitos'}
            </p>
          </div>
        </div>

        {/* Gravame */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${hasGravame ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-950/60 border-zinc-800/80'}`}>
          {hasGravame ? (
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400 font-medium">Gravame / Alienação</p>
            <p className={`text-xs font-bold ${hasGravame ? 'Alienado' : 'text-zinc-200'}`}>
              {hasGravame ? 'Alienado' : 'Liberado'}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Detailed Specifications Grid */}
      <div className="rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#c9a44c]" />
          <span>Ficha Técnica e Dados Cadastrais</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-zinc-400 block mb-1">Marca</span>
            <span className="font-bold text-white text-sm">{brand}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Modelo</span>
            <span className="font-bold text-white text-sm">{model}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Ano Fabricação / Modelo</span>
            <span className="font-bold text-white text-sm">{yearFab} / {yearMod}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Cor Predominante</span>
            <span className="font-bold text-white text-sm">{color}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Combustível</span>
            <span className="font-bold text-white text-sm">{fuel}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Município / UF</span>
            <span className="font-bold text-white text-sm">{city} / {state}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Final do Chassi</span>
            <span className="font-mono font-bold text-white text-sm">{chassi}</span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Final do Renavam</span>
            <span className="font-mono font-bold text-white text-sm">{renavam}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
