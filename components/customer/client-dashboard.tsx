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
  ShieldCheck,
  User,
  CreditCard,
  Download,
  Car,
  Sparkles,
  ExternalLink,
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Laudo Pronto</span>
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          <span>Processando</span>
        </span>
      );
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Na Fila</span>
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span>Aguardando Pagamento</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
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
      toast.error('Informe uma placa válida no formato Mercosul (ABC1D23) ou padrão antigo (ABC-1234).');
      return;
    }

    router.push(`/cliente/pagamento/nova?placa=${encodeURIComponent(cleanPlate)}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Executive Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900/95 via-[#0d121c] to-[#07090f] border border-zinc-800/80 p-6 sm:p-9 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Ambient Glow Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#c9a44c]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PAINEL DO CLIENTE • AF MOTOS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-heading leading-tight">
              {getGreeting(firstName)}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              Acesse seus laudos oficiais, consulte o histórico veicular de motos e carros e baixe seus relatórios em PDF com total segurança.
            </p>
          </div>

          {/* Quick Consultation Interactive Box */}
          <div className="w-full lg:w-auto shrink-0">
            <form
              onSubmit={handleQuickLookup}
              className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-zinc-950/80 rounded-2xl border border-zinc-800 shadow-xl"
            >
              <div className="relative w-full sm:w-44">
                <input
                  type="text"
                  value={quickPlate}
                  onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC1D23"
                  maxLength={8}
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white font-mono font-bold text-center tracking-widest uppercase placeholder:text-zinc-500 placeholder:font-normal focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c] text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto h-11 px-5 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold rounded-xl shadow-lg shadow-[#c9a44c]/20 flex items-center justify-center gap-2 text-xs transition-transform active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Consultar Placa</span>
              </Button>
            </form>
            <span className="text-[11px] text-zinc-500 block text-center sm:text-right mt-1.5 font-medium">
              Formato Mercosul ou Padrão Antigo
            </span>
          </div>
        </div>
      </div>

      {/* Metrics & Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Consultations */}
        <div className="relative rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl shadow-lg hover:border-zinc-700 transition-all overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Consultas Totais
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#c9a44c]">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">
              {data.stats.total_consultations}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Registros salvos na sua conta</p>
          </div>
        </div>

        {/* Card 2: Completed / Ready Reports */}
        <Link
          href="/cliente/consultas"
          className="relative rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-all overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
              Laudos Disponíveis
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-white font-mono">
                {data.stats.completed_consultations ?? data.stats.total_consultations}
              </span>
              <p className="text-xs text-zinc-500 mt-1">Prontos para visualização e PDF</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Card 3: Profile & Security */}
        <Link
          href="/cliente/perfil"
          className="relative rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl shadow-lg hover:border-[#c9a44c]/40 transition-all overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c]/30 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#c9a44c] transition-colors">
              Dados Cadastrais
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-base font-bold text-white block">
                {data.profile.full_name}
              </span>
              <p className="text-xs text-[#c9a44c] font-semibold mt-1">Gerenciar perfil e endereço →</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#c9a44c] group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Consultations Section */}
      <div className="rounded-3xl bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Car className="w-5 h-5 text-[#c9a44c]" />
              <span>Consultas Recentes</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhe e baixe os laudos das placas consultadas recentemente na sua conta
            </p>
          </div>
          {data.recent_consultations.length > 0 && (
            <Link
              href="/cliente/consultas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c9a44c] hover:text-[#e0bb5d] transition-colors"
            >
              <span>Ver histórico completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {data.recent_consultations.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto shadow-inner">
              <Car className="w-7 h-7 text-[#c9a44c]" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-white">Nenhuma consulta realizada ainda</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Consulte qualquer placa de moto ou carro para obter histórico completo, débitos, multas e restrições.
              </p>
            </div>
            <Link href="/historico-veicular" className="inline-block pt-2">
              <Button className="h-11 px-6 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-[#c9a44c]/20">
                <PlusCircle className="w-4 h-4 mr-2" />
                Fazer primeira consulta
              </Button>
            </Link>
          </div>
        ) : (
          /* Recent Cards List */
          <div className="space-y-3">
            {data.recent_consultations.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
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
                  className="rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Plate Stamp Badge */}
                    <div className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 shadow-md font-mono font-black text-sm text-white tracking-widest uppercase shrink-0">
                      {formatBrazilianPlate(item.plate)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-white truncate group-hover:text-[#c9a44c] transition-colors">
                          {vehicleTitle}
                        </p>
                        {item.vehicle_data?.year && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                            {item.vehicle_data.year}
                          </span>
                        )}
                        {item.vehicle_data?.color && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400">
                            {item.vehicle_data.color}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Consultado em {formattedDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/60">
                    <div>{getStatusBadge(item.status)}</div>

                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <a
                          href={pdfDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={pdfFilename}
                          title="Baixar Laudo Oficial em PDF"
                          className="h-9 px-3 text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-700/80 hover:border-[#c9a44c]/60 text-zinc-200 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-[#c9a44c]" />
                          <span className="hidden sm:inline">PDF</span>
                        </a>
                      )}

                      <Link href={targetHref}>
                        <Button
                          size="sm"
                          className={`h-9 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all ${
                            item.status === 'pending'
                              ? 'bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                          }`}
                        >
                          <span>{item.status === 'pending' ? 'Pagar' : 'Ver Laudo'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#c9a44c]" />
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
