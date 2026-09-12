'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FilterX,
  PlusCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ConsultationHistoryResult, ConsultationStatus } from '@/lib/customer/types';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { CustomerPlateBadge } from './customer-plate-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConsultationHistoryProps {
  data: ConsultationHistoryResult;
  initialPlateFilter?: string;
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

export function ConsultationHistory({
  data,
  initialPlateFilter = '',
}: ConsultationHistoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialPlateFilter);
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (item: { id: string; plate: string }) => {
    if (downloadingId) return;
    try {
      setDownloadingId(item.id);
      toast.info('Gerando seu Laudo Oficial em PDF...');
      const res = await fetch(`/api/cliente/consultas/${item.id}/pdf`);
      if (!res.ok) throw new Error('Falha no download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-veicular_${item.plate}_${item.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('Laudo baixado com sucesso!');
    } catch {
      toast.error('Erro ao gerar laudo em PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (searchTerm.trim()) {
      params.set('placa', searchTerm.trim());
      params.set('page', '1');
    } else {
      params.delete('placa');
      params.set('page', '1');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('placa');
    params.set('page', '1');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Histórico de Consultas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {data.total_count} {data.total_count === 1 ? 'consulta encontrada' : 'consultas encontradas'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleFilterSubmit} className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Filtrar por placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="pl-9 pr-9 h-10 w-48 sm:w-64 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-xl text-xs font-mono"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <FilterX className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <Link href="/cliente/consultas/nova">
            <Button
              size="sm"
              className="h-10 px-4 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-[#c9a44c]/10 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Consulta</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Consultations Table / Cards Container */}
      <div className="rounded-3xl bg-zinc-950/60 border border-zinc-800/80 overflow-hidden backdrop-blur-xl shadow-xl">
        {data.consultations.length === 0 ? (
          /* Empty state */
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-white">Nenhuma consulta encontrada</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchTerm
                  ? `Nenhum laudo corresponde ao filtro "${searchTerm}".`
                  : 'Você ainda não realizou consultas de placas na sua conta.'}
              </p>
            </div>
            {searchTerm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="h-9 px-4 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 rounded-xl"
              >
                Limpar Filtro
              </Button>
            ) : (
              <Link href="/cliente/consultas/nova" className="inline-block pt-2">
                <Button className="h-10 px-5 bg-[#c9a44c] hover:bg-[#b38e3a] text-zinc-950 font-bold text-xs rounded-xl">
                  Consultar Primeira Placa
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Placa</th>
                    <th className="py-3.5 px-6">Veículo</th>
                    <th className="py-3.5 px-6">Data da Consulta</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {data.consultations.map((item) => {
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
                      <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors group">
                        <td className="py-3 px-6">
                          <CustomerPlateBadge plate={item.plate} size="sm" />
                        </td>
                        <td className="py-4 px-6 text-zinc-200">
                          {item.vehicle_data?.brand || item.vehicle_data?.model ? (
                            <div>
                              <span className="font-semibold text-white">
                                {[item.vehicle_data.brand, item.vehicle_data.model]
                                  .filter(Boolean)
                                  .join(' ')}
                              </span>
                              {(item.vehicle_data.year_model || item.vehicle_data.color) && (
                                <span className="text-xs text-zinc-400 block mt-0.5">
                                  {[item.vehicle_data.year_model, item.vehicle_data.color]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">Dados em processamento</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-zinc-400">{formattedDate}</td>
                        <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {item.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(item)}
                                disabled={downloadingId === item.id}
                                className={`h-8 px-2.5 text-xs bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 hover:border-[#c9a44c]/60 text-zinc-300 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs ${
                                  downloadingId === item.id ? 'opacity-80 cursor-wait' : 'active:scale-95'
                                }`}
                                title="Baixar Laudo PDF"
                              >
                                {downloadingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 text-[#c9a44c] animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 text-[#c9a44c]" />
                                )}
                                <span className="hidden xl:inline">
                                  {downloadingId === item.id ? 'Gerando...' : 'PDF'}
                                </span>
                              </button>
                            )}

                            <Link href={targetHref}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700 text-zinc-200 group-hover:border-[#c9a44c]/50 rounded-lg inline-flex items-center gap-1.5"
                              >
                                <span>{item.status === 'pending' ? 'Pagar' : 'Ver Laudo'}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#c9a44c]" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-zinc-800/80">
              {data.consultations.map((item) => {
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
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <CustomerPlateBadge plate={item.plate} size="sm" />
                      {getStatusBadge(item.status)}
                    </div>

                    <div>
                      {item.vehicle_data?.brand || item.vehicle_data?.model ? (
                        <p className="text-sm font-bold text-white">
                          {[item.vehicle_data.brand, item.vehicle_data.model].filter(Boolean).join(' ')}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400">Consulta de placa</p>
                      )}
                      <p className="text-[11px] text-zinc-400 mt-0.5">{formattedDate}</p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      {item.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(item)}
                          disabled={downloadingId === item.id}
                          className={`h-9 px-3 text-xs bg-zinc-900 border border-zinc-700 hover:border-[#c9a44c]/60 text-zinc-200 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                            downloadingId === item.id ? 'opacity-80 cursor-wait' : 'active:scale-95'
                          }`}
                          title="Baixar Laudo PDF"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-[#c9a44c] animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#c9a44c]" />
                          )}
                          <span>{downloadingId === item.id ? 'Gerando...' : 'PDF'}</span>
                        </button>
                      )}
                      <Link href={targetHref} className="flex-1 block">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <span>{item.status === 'pending' ? 'Pagar Consulta' : 'Abrir Laudo Completo'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#c9a44c]" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {data.total_pages > 1 && (
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Página {data.page} de {data.total_pages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1 || isPending}
                    onClick={() => handlePageChange(data.page - 1)}
                    className="h-8 px-2.5 bg-zinc-900 border-zinc-700 text-zinc-200 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.total_pages || isPending}
                    onClick={() => handlePageChange(data.page + 1)}
                    className="h-8 px-2.5 bg-zinc-900 border-zinc-700 text-zinc-200 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
