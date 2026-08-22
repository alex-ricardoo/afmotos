import React from 'react';
import Link from 'next/link';
import { Sparkles, SlidersHorizontal, ArrowLeft, ShieldCheck } from 'lucide-react';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { MotorcycleFilters, MobileFiltersDrawer } from '@/components/filters/motorcycle-filters';
import { getAllMotorcycles } from '@/lib/queries/motorcycles';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Estoque de Motos | AF Locações e Vendas',
  description:
    'Confira nosso catálogo de motocicletas selecionadas com laudo cautelar aprovado e garantia total de procedência.',
};

interface CatalogProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatalogPage({ searchParams }: CatalogProps) {
  const resolvedParams = await searchParams;
  const motos = await getAllMotorcycles(resolvedParams);

  const activeBrand =
    typeof resolvedParams.brand === 'string'
      ? resolvedParams.brand
      : undefined;
  const activeSearch =
    typeof (resolvedParams.search || resolvedParams.q) === 'string'
      ? ((resolvedParams.search || resolvedParams.q) as string)
      : undefined;

  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Banner */}
      <div className="bg-[#0d0d0d] text-white py-10 md:py-14 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#e3c56c]" />
              <span>100% com Laudo Cautelar & Revisão de Entrega</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
              Estoque de Motocicletas
            </h1>

            <p className="text-sm md:text-base text-[#a6a6a1] leading-relaxed">
              Encontre o modelo perfeito com procedência assegurada, documentação regularizada e as melhores condições para compra ou locação.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Results & Mobile Filter Trigger Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#c9a44c]/20">
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base font-extrabold text-[#e3c56c]">
              {motos.length}
            </span>
            <span className="text-sm text-[#a6a6a1]">
              {motos.length === 1
                ? 'motocicleta disponível'
                : 'motocicletas disponíveis'}
            </span>
            {(activeBrand || activeSearch) && (
              <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-semibold text-[#e3c56c]">
                Filtros ativos
              </span>
            )}
          </div>

          <MobileFiltersDrawer totalResults={motos.length} />
        </div>

        {/* Catalog Grid + Desktop Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block md:col-span-1 sticky top-28">
            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c9a44c]/20">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#e3c56c]" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                    Filtros
                  </h3>
                </div>
              </div>

              <MotorcycleFilters />
            </div>
          </aside>

          {/* Motorcycle Cards Grid */}
          <main className="md:col-span-3">
            <MotorcycleGrid
              motorcycles={motos}
              emptyMessage="Nenhuma moto encontrada com os filtros atuais. Tente ajustar a busca ou limpar os filtros."
            />
          </main>
        </div>
      </div>
    </div>
  );
}
