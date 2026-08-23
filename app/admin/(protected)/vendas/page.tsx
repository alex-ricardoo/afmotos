import Link from 'next/link';
import { Plus, ShoppingBag, Receipt } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getSales, getSalesMetrics } from '@/lib/queries/sales';
import { SalesSummary } from '@/components/admin/sales/sales-summary';
import { SaleFilters } from '@/components/admin/sales/sale-filters';
import { SalesTable } from '@/components/admin/sales/sales-table';
import { SaleCard } from '@/components/admin/sales/sale-card';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Vendas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Histórico de Vendas</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              {sales.length} {sales.length === 1 ? 'registro' : 'registros'}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte negociações concluídas, emita recibos em PDF e acompanhe o faturamento.
          </p>
        </div>

        <Link
          href="/admin/vendas/nova"
          className={buttonVariants({
            className:
              'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer self-start sm:self-auto',
          })}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Registrar Venda</span>
        </Link>
      </div>

      {/* Indicadores / Cards de Resumo */}
      <SalesSummary metrics={metrics} />

      {/* Filtros */}
      <SaleFilters />

      {/* Listagem Responsiva */}
      {sales.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Nenhuma venda encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Nenhuma venda corresponde aos filtros selecionados ou ainda não há registros de vendas
              efetuadas.
            </p>
          </div>
          <Link
            href="/admin/vendas/nova"
            className={buttonVariants({
              variant: 'outline',
              className: 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10',
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
