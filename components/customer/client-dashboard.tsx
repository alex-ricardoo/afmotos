'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  PlusCircle,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  CreditCard,
  Download,
  Car,
  FileText,
} from 'lucide-react';
import type { DashboardData, ConsultationStatus } from '@/lib/customer/types';
import { formatBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClientDashboardProps {
  data: DashboardData;
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  let timeGreeting = 'Olá';
  if (hour >= 5 && hour < 12) timeGreeting = 'Bom dia';
  else if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
  else timeGreeting = 'Boa noite';

  return `${timeGreeting}, ${name}!`;
}

function getStatusBadge(status: ConsultationStatus) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3" />
          <span>Laudo Pronto</span>
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 animate-pulse">
          <Clock className="w-3 h-3" />
          <span>Processando</span>
        </span>
      );
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <Clock className="w-3 h-3" />
          <span>Na Fila</span>
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <CreditCard className="w-3 h-3 text-amber-400" />
          <span>Aguardando Pagamento</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/25">
          <AlertTriangle className="w-3 h-3" />
          <span>Falha</span>
        </span>
      );
    default:
      return null;
  }
}

export function ClientDashboard({ data }: ClientDashboardProps) {
  const router = useRouter();
  const firstName = data.profile.full_name.split(' ')[0] || 'Cliente';
  const [quickPlate, setQuickPlate] = useState('');

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = quickPlate.trim().toUpperCase();
    if (!cleanPlate) {
      toast.error('Digite uma placa para consultar.');
      return;
    }
    if (!isValidBrazilianPlate(cleanPlate)) {
      toast.error('Informe uma placa válida no formato Mercosul (ABC1D23) ou antigo (ABC-1234).');
      return;
    }

    router.push(`/cliente/pagamento/nova?placa=${encodeURIComponent(cleanPlate)}`);
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome Bar & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-zinc-950 via-[#0e121a] to-zinc-950 border border-zinc-800/90 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-70" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c9a44c]" />
            <span className="text-[11px] font-bold text-[#c9a44c] uppercase tracking-wider">
              Painel do Cliente
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            {getGreeting(firstName)}
          </h1>
          <p className="text-xs text-zinc-400 max-w-md">
            Consulte novas placas e visualize os laudos veiculares da sua conta.
          </p>
        </div>

        <Link href="/cliente/consultas/nova" className="shrink-0">
          <Button className="w-full sm:w-auto h-11 px-5 bg-gradient-to-r from-[#c9a44c] via-[#d4b35e] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#c9a44c]/15 transition-all flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Nova Consulta Veicular</span>
          </Button>
        </Link>
      </div>

      {/* Quick Search Strip (Compact & Mobile-first) */}
      <form
        onSubmit={handleQuickLookup}
        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-md backdrop-blur-xl"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={quickPlate}
            onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
            placeholder="Digite a placa (ex: ABC1D23)"
            maxLength={8}
            className="w-full h-10 px-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white font-mono font-bold text-sm tracking-wider placeholder:font-sans placeholder:text-zinc-500 placeholder:tracking-normal placeholder:text-xs uppercase focus:outline-none focus:border-[#c9a44c] transition-colors"
          />
        </div>

        <Button
          type="submit"
          className="h-10 px-4 sm:px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700/80 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#c9a44c]" />
          <span>Consultar</span>
        </Button>
      </form>

      {/* Metrics Strip (Compact 2/3 Column Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Consultas Totais */}
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider truncate">
              Consultas Totais
            </span>
            <FileCheck2 className="w-4 h-4 text-[#c9a44c] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
              {data.stats.total_consultations}
            </span>
            <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">
              no histórico
            </span>
          </div>
        </div>

        {/* Card 2: Laudos Prontos */}
        <Link
          href="/cliente/consultas"
          className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/40 p-3.5 sm:p-4 backdrop-blur-xl shadow-sm transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors truncate">
              Laudos Prontos
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono leading-none">
              {data.stats.completed_consultations ?? data.stats.total_consultations}
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 truncate hidden sm:inline transition-colors">
              em PDF →
            </span>
          </div>
        </Link>

        {/* Card 3: Meu Perfil (Takes full width on mobile or 3rd column on desktop) */}
        <Link
          href="/cliente/perfil"
          className="col-span-2 sm:col-span-1 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-[#c9a44c]/40 p-3.5 sm:p-4 backdrop-blur-xl shadow-sm transition-colors group flex sm:flex-col justify-between items-center sm:items-start"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#c9a44c] transition-colors">
              Meu Perfil
            </span>
            <User className="w-4 h-4 text-zinc-400 group-hover:text-[#c9a44c] transition-colors shrink-0" />
          </div>
          <div className="mt-0 sm:mt-2 text-right sm:text-left">
            <span className="text-xs sm:text-sm font-bold text-white block truncate max-w-[140px] sm:max-w-none">
              {data.profile.full_name}
            </span>
            <span className="text-[10px] text-[#c9a44c] font-medium hidden sm:inline">
              Gerenciar dados →
            </span>
          </div>
        </Link>
      </div>

      {/* Recent Consultations Section */}
      <div className="rounded-2xl sm:rounded-3xl bg-zinc-950/80 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#c9a44c]" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Consultas Recentes
            </h2>
          </div>
          {data.recent_consultations.length > 0 && (
            <Link
              href="/cliente/consultas"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#c9a44c] hover:underline"
            >
              <span>Ver histórico</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {data.recent_consultations.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
              <Car className="w-5 h-5 text-[#c9a44c]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">Nenhuma consulta realizada</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Consulte qualquer placa de moto ou carro para obter o histórico completo.
              </p>
            </div>
            <Link href="/cliente/consultas/nova" className="inline-block pt-1">
              <Button className="h-9 px-4 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl shadow-md">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Fazer primeira consulta
              </Button>
            </Link>
          </div>
        ) : (
          /* Recent Consultations List */
          <div className="space-y-2.5">
            {data.recent_consultations.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              const targetHref =
                item.status === 'pending'
                  ? `/cliente/pagamento/${item.id}`
                  : `/cliente/consultas/${item.id}`;

              const pdfDownloadUrl = `/api/cliente/consultas/${item.id}/pdf`;
              const pdfFilename = `laudo-veicular_${item.plate_normalized}_${item.id.slice(0, 8)}.pdf`;

              const vehicleTitle =
                item.vehicle_data?.brand || item.vehicle_data?.model
                  ? [item.vehicle_data.brand, item.vehicle_data.model].filter(Boolean).join(' ')
                  : 'Veículo Consultado';

              return (
                <div
                  key={item.id}
                  className="rounded-xl sm:rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/70 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Plate Pill */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono font-black text-xs text-[#c9a44c] tracking-wider uppercase shrink-0">
                      {formatBrazilianPlate(item.plate)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#c9a44c] transition-colors">
                        {vehicleTitle}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{formattedDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/40">
                    <div>{getStatusBadge(item.status)}</div>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'completed' && (
                        <a
                          href={pdfDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={pdfFilename}
                          title="Baixar Laudo em PDF"
                          className="h-8 px-2.5 text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3 text-[#c9a44c]" />
                          <span className="hidden sm:inline">PDF</span>
                        </a>
                      )}

                      <Link href={targetHref}>
                        <Button
                          size="sm"
                          className={`h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                            item.status === 'pending'
                              ? 'bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80'
                          }`}
                        >
                          <span>{item.status === 'pending' ? 'Pagar' : 'Ver'}</span>
                          <ArrowRight className="w-3 h-3 text-[#c9a44c]" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
