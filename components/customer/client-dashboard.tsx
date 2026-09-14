'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
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
  Loader2,
  Coins,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardData, ConsultationStatus } from '@/lib/customer/types';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { CustomerPlateBadge } from './customer-plate-badge';
import { Button } from '@/components/ui/button';

interface ClientDashboardProps {
  data: DashboardData;
  creditBalance?: number;
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

export function ClientDashboard({ data, creditBalance = 0 }: ClientDashboardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (item: { id: string; plate_normalized: string }) => {
    if (downloadingId) return;
    try {
      setDownloadingId(item.id);
      toast.info('Gerando seu Laudo Oficial em PDF...');
      const res = await fetch(`/api/cliente/consultas/${item.id}/pdf`);
      if (!res.ok) throw new Error('Falha no download do laudo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-veicular_${item.plate_normalized}_${item.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('Laudo baixado com sucesso!');
    } catch {
      toast.error('Não foi possível gerar o PDF. Tente novamente mais tarde.');
    } finally {
      setDownloadingId(null);
    }
  };

  const greeting = getGreeting(data.profile.full_name?.split(' ')[0] || 'Cliente');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Section with Welcome and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {greeting}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c9a44c]/10 text-[#e3c56c] border border-[#c9a44c]/20">
              Painel do Cliente
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhe suas consultas veiculares e emita laudos oficiais com rapidez.
          </p>
        </div>

        <Link href="/cliente/consultas/nova">
          <Button className="w-full sm:w-auto h-11 px-5 bg-gradient-to-r from-[#c9a44c] via-[#d4b35e] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#c9a44c]/15 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <PlusCircle className="w-4 h-4" />
            <span>Nova Consulta Veicular</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Strip (Responsive 4-Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* Card 3: Créditos Disponíveis (B2B) */}
        <Link
          href="/cliente/creditos"
          className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-[#c9a44c]/50 p-3.5 sm:p-4 backdrop-blur-xl shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#e3c56c] transition-colors truncate">
              Meus Créditos
            </span>
            <Coins className="w-4 h-4 text-[#e3c56c] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#e3c56c] font-mono leading-none">
              {creditBalance}
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-[#e3c56c] truncate hidden sm:inline transition-colors">
              {creditBalance > 0 ? 'disponíveis →' : 'comprar pacote →'}
            </span>
          </div>
        </Link>

        {/* Card 4: Meu Perfil */}
        <Link
          href="/cliente/perfil"
          className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-[#c9a44c]/40 p-3.5 sm:p-4 backdrop-blur-xl shadow-sm transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#c9a44c] transition-colors">
              Meu Perfil
            </span>
            <User className="w-4 h-4 text-zinc-400 group-hover:text-[#c9a44c] transition-colors shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-xs sm:text-sm font-bold text-white block truncate">
              {data.profile.full_name}
            </span>
            <span className="text-[10px] text-[#c9a44c] font-medium hidden sm:inline">
              Gerenciar dados →
            </span>
          </div>
        </Link>
      </div>

      {/* Banner Promocional de Pacotes de Créditos B2B */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#c9a44c]/30 bg-gradient-to-r from-zinc-950 via-[#c9a44c]/10 to-zinc-950 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
              Vantagem B2B
            </span>
            <span className="text-xs font-bold text-zinc-300">Para Lojistas, Revendedores e Compradores Frequentes</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Consulte veículos com desconto em pacotes de créditos pré-pagos
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Feche pacotes de 5 a 50+ consultas negociadas diretamente no WhatsApp. Liberação imediata e você não precisa pagar cartão a cada placa.
          </p>
        </div>

        <Link href="/cliente/creditos" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-extrabold text-xs h-10 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Coins className="w-4 h-4" />
            <span>Conhecer Pacotes de Créditos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
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
                    {/* Plate Badge with Mercosul / Gray distinction */}
                    <div className="shrink-0">
                      <CustomerPlateBadge plate={item.plate} size="sm" />
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
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(item)}
                          disabled={downloadingId === item.id}
                          title="Baixar Laudo em PDF"
                          className={`h-8 px-2.5 text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg inline-flex items-center gap-1 transition-all ${
                            downloadingId === item.id ? 'opacity-80 cursor-wait' : 'active:scale-95'
                          }`}
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="w-3 h-3 text-[#c9a44c] animate-spin" />
                          ) : (
                            <Download className="w-3 h-3 text-[#c9a44c]" />
                          )}
                          <span className="hidden sm:inline">
                            {downloadingId === item.id ? 'Gerando...' : 'PDF'}
                          </span>
                        </button>
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
