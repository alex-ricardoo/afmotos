import React, { Suspense } from 'react';
import Link from 'next/link';
import { Users, Plus, UsersRound, ChevronLeft, ChevronRight, Inbox, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCustomers, getCustomerMetrics } from '@/lib/queries/customers';
import { CustomerList } from '@/components/admin/customers/customer-list';
import { CustomerMobileCard } from '@/components/admin/customers/customer-mobile-card';
import { CustomerFilters } from '@/components/admin/customers/customer-filters';
import { CustomerSummaryKpis } from '@/components/admin/customers/customer-summary-kpis';
import { CustomerSearchParams } from '@/lib/validations/customer';

export const metadata = {
  title: 'Carteira de Clientes & CRM | AF Motos',
  description: 'Gestão da carteira de clientes, histórico de negociações e inteligência comercial.',
};

interface ClientesPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    gender?: string;
    source?: string;
    status?: string;
    relationship_type?: string;
    date_range?: string;
  }>;
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const resolvedParams = await searchParams;

  const params: CustomerSearchParams = {
    q: resolvedParams.q,
    page: Number(resolvedParams.page) || 1,
    limit: Number(resolvedParams.limit) || 20,
    gender: resolvedParams.gender,
    source: resolvedParams.source,
    status: (resolvedParams.status as any) || 'active',
    relationship_type: resolvedParams.relationship_type,
    date_range: resolvedParams.date_range,
  };

  const [metrics, customersResult] = await Promise.all([
    getCustomerMetrics(),
    getCustomers(params),
  ]);

  const { data: customers, totalCount, page, totalPages, limit } = customersResult;

  const hasFilters = Boolean(
    resolvedParams.q ||
      resolvedParams.source ||
      resolvedParams.gender ||
      (resolvedParams.status && resolvedParams.status !== 'active') ||
      resolvedParams.date_range,
  );

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Top Header com padrão visual de Vendas/Motos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Carteira de Clientes
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              {totalCount} {totalCount === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Consulte contatos, histórico 360°, preferências de atendimento e vínculos comerciais.
          </p>
        </div>

        <Link
          href="/admin/clientes/novo"
          className="bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold rounded-xl px-5 h-11 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Cliente</span>
        </Link>
      </div>

      {/* Indicadores / Cards de Resumo */}
      <CustomerSummaryKpis metrics={metrics} />

      {/* Filtros e Busca */}
      <Suspense fallback={<div className="h-10 bg-zinc-900/40 rounded-xl animate-pulse" />}>
        <CustomerFilters />
      </Suspense>

      {/* Listagem de Clientes */}
      {customers.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <CustomerList customers={customers} />
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {customers.map((c) => (
              <CustomerMobileCard key={c.id} customer={c} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
              <div>
                Exibindo <strong>{(page - 1) * limit + 1}</strong> a{' '}
                <strong>{Math.min(page * limit, totalCount)}</strong> de{' '}
                <strong>{totalCount}</strong> clientes
              </div>

              <div className="flex items-center gap-1.5">
                {page > 1 ? (
                  <Link
                    href={{
                      pathname: '/admin/clientes',
                      query: { ...resolvedParams, page: page - 1 },
                    }}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-800 bg-[#0f0f13] text-zinc-300 hover:text-white text-xs gap-1 font-medium transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Link>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    size="sm"
                    className="h-8 border-zinc-900 bg-zinc-900/40 text-zinc-600 text-xs gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Button>
                )}

                <span className="px-2 font-medium text-zinc-300">
                  Página {page} de {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    href={{
                      pathname: '/admin/clientes',
                      query: { ...resolvedParams, page: page + 1 },
                    }}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-800 bg-[#0f0f13] text-zinc-300 hover:text-white text-xs gap-1 font-medium transition-colors"
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    size="sm"
                    className="h-8 border-zinc-900 bg-zinc-900/40 text-zinc-600 text-xs gap-1"
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
            {hasFilters ? (
              <Inbox className="w-8 h-8 text-zinc-400" />
            ) : (
              <UsersRound className="w-8 h-8 text-[#c9a44c]" />
            )}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">
              {hasFilters ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
            </h3>
            <p className="text-xs text-zinc-400">
              {hasFilters
                ? 'Nenhum cliente corresponde aos filtros aplicados. Tente ajustar os termos de busca ou limpar os filtros.'
                : 'Sua carteira de clientes está vazia. Comece cadastrando seu primeiro cliente ou registrando uma nova venda.'}
            </p>
          </div>
          <div>
            {hasFilters ? (
              <Link
                href="/admin/clientes"
                className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors font-medium"
              >
                Limpar Filtros
              </Link>
            ) : (
              <Link
                href="/admin/clientes/novo"
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold rounded-xl px-5 h-10 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all gap-2 text-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Cadastrar Primeiro Cliente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
