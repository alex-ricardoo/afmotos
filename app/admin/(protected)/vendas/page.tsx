import Link from 'next/link';
import { Plus, Receipt, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getSales, getSalesMetrics } from '@/lib/queries/sales';
import { SalesSummary } from '@/components/admin/sales/sales-summary';
import { SaleFilters } from '@/components/admin/sales/sale-filters';
import { SalesTable } from '@/components/admin/sales/sales-table';
import { SaleCard } from '@/components/admin/sales/sale-card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Vendas & Recibos | AF Motos Admin',
  description: 'Histórico de vendas, emissão de recibos e controle de faturamento.',
};

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    month?: string;
    payment?: string;
  }>;
}) {
  const { search, month, payment } = await searchParams;

  const [metrics, sales] = await Promise.all([
    getSalesMetrics(),
    getSales({
      search,
      month,
      paymentMethod: payment,
    }),
  ]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Histórico de Vendas
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              {sales.length} {sales.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Consulte negociações concluídas, emita recibos em PDF e acompanhe o faturamento.
          </p>
        </div>

        <Link
          href="/admin/vendas/nova"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold rounded-xl px-5 h-11 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-sm',
          )}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Venda</span>
        </Link>
      </div>

      {/* Indicadores / Cards de Resumo */}
      <SalesSummary metrics={metrics} />

      {/* Filtros */}
      <SaleFilters />

      {/* Listagem Responsiva */}
      {sales.length === 0 ? (
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
            <Receipt className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Nenhuma venda encontrada</h3>
            <p className="text-xs text-zinc-400">
              Nenhuma venda corresponde aos filtros selecionados ou ainda não há registros de vendas
              efetuadas.
            </p>
          </div>
          <Link
            href="/admin/vendas/nova"
            className={buttonVariants({
              variant: 'outline',
              className: 'border-zinc-800 text-zinc-300 hover:text-white rounded-xl cursor-pointer',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeira Venda
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <SalesTable sales={sales} />
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
