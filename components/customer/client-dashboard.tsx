'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import type { DashboardData, ConsultationStatus } from '@/lib/customer/types';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { Button } from '@/components/ui/button';

interface ClientDashboardProps {
  data: DashboardData;
}

function getStatusBadge(status: ConsultationStatus) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Concluído</span>
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          <span>Processando</span>
        </span>
      );
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Pago / Na Fila</span>
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Aguardando Pagamento</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Falha</span>
        </span>
      );
    default:
      return null;
  }
}

export function ClientDashboard({ data }: ClientDashboardProps) {
  const firstName = data.profile.full_name.split(' ')[0] || 'Cliente';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9a44c]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c]/60 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel Autenticado</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Olá, <span className="text-[#c9a44c]">{firstName}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Gerencie suas consultas veiculares, acompanhe laudos e mantenha seus dados cadastrais sempre atualizados.
            </p>
          </div>

          <Link href="/historico-veicular">
            <Button className="h-12 px-6 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold rounded-2xl shadow-lg shadow-[#c9a44c]/20 flex items-center gap-2.5 transition-all duration-200 shrink-0">
              <PlusCircle className="w-5 h-5" />
              <span>Nova Consulta</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Stat 1: Total Consultations */}
        <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#c9a44c] shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Total de Consultas</p>
            <p className="text-2xl font-black text-white mt-0.5">{data.stats.total_consultations}</p>
          </div>
        </div>

        {/* Stat 2: Quick Access to History */}
        <Link
          href="/cliente/consultas"
          className="group rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-xl flex items-center justify-between hover:border-[#c9a44c]/40 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Histórico de Laudos</p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5 group-hover:text-white">Ver todas as placas</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#c9a44c] group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Stat 3: Profile Settings */}
        <Link
          href="/cliente/perfil"
          className="group rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-xl flex items-center justify-between hover:border-[#c9a44c]/40 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Meus Dados</p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5 group-hover:text-white">Editar meu perfil</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#c9a44c] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Consultations Section */}
      <div className="rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-6 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Últimas Consultas</h2>
            <p className="text-xs text-zinc-400">Consultas de placas recentes realizadas na sua conta</p>
          </div>
          {data.recent_consultations.length > 0 && (
            <Link
              href="/cliente/consultas"
              className="text-xs font-semibold text-[#c9a44c] hover:underline flex items-center gap-1"
            >
              <span>Ver histórico completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {data.recent_consultations.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Nenhuma consulta realizada ainda</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Consulte qualquer placa de moto ou carro para obter histórico completo, débitos, multas e restrições.
              </p>
            </div>
            <Link href="/historico-veicular" className="inline-block pt-2">
              <Button className="h-10 px-5 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl">
                Fazer primeira consulta
              </Button>
            </Link>
          </div>
        ) : (
          /* Recent list */
          <div className="divide-y divide-zinc-800/80">
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

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-sm text-zinc-100 tracking-wider">
                      {formatBrazilianPlate(item.plate)}
                    </div>
                    <div>
                      {item.vehicle_data?.brand || item.vehicle_data?.model ? (
                        <p className="text-sm font-bold text-white">
                          {[item.vehicle_data.brand, item.vehicle_data.model].filter(Boolean).join(' ')}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-zinc-400">Consulta de placa</p>
                      )}
                      <p className="text-xs text-zinc-400 mt-0.5">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {getStatusBadge(item.status)}

                    <Link href={targetHref}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200 group-hover:border-[#c9a44c]/50 rounded-lg flex items-center gap-1.5"
                      >
                        <span>{item.status === 'pending' ? 'Pagar' : 'Ver Detalhes'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#c9a44c]" />
                      </Button>
                    </Link>
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
