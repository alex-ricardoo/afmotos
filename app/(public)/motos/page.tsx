import React from 'react';
import { SlidersHorizontal, ShieldCheck, Wrench, FileCheck } from 'lucide-react';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import {
  MotorcycleFilters,
  MobileFiltersDrawer,
  CatalogControls,
} from '@/components/filters/motorcycle-filters';
import { getAllMotorcycles, getMotorcycleFilterFacets } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { Metadata } from 'next';
import { buildPageMetadata, JsonLd, buildBreadcrumbsSchema, SEO_CONFIG } from '@/lib/seo';

interface CatalogProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: CatalogProps): Promise<Metadata> {
  const [resolvedParams, settings] = await Promise.all([searchParams, getSettings()]);
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  const hasFilters = Object.keys(resolvedParams || {}).some(
    (key) =>
      resolvedParams[key] !== undefined &&
      resolvedParams[key] !== '' &&
      resolvedParams[key] !== 'all',
  );

  const brandFilter =
    typeof resolvedParams?.brand === 'string' && resolvedParams.brand !== 'all'
      ? resolvedParams.brand
      : undefined;
  const title = brandFilter
    ? `Motos ${brandFilter} Usadas e Seminovas | ${siteName}`
    : `Motos Usadas e Seminovas à Venda | ${siteName}`;

  return buildPageMetadata({
    title,
    description: `Confira as motos disponíveis na ${siteName} em Cabo de Santo Agostinho - PE. Veículos 100% revisados, com laudo cautelar e garantia. Negociação facilitada pelo WhatsApp.`,
    path: '/motos',
    noIndex: hasFilters,
  });
}

export default async function CatalogPage({ searchParams }: CatalogProps) {
  const resolvedParams = await searchParams;
  const [motos, facets, settings] = await Promise.all([
    getAllMotorcycles(resolvedParams),
    getMotorcycleFilterFacets(),
    getSettings(),
  ]);

  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const activeBrand = typeof resolvedParams.brand === 'string' ? resolvedParams.brand : undefined;
  const activeSearch =
    typeof (resolvedParams.search || resolvedParams.q) === 'string'
      ? ((resolvedParams.search || resolvedParams.q) as string)
      : undefined;

  const currentView =
    typeof resolvedParams.view === 'string' && resolvedParams.view === 'list' ? 'list' : 'grid';

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Motos Disponíveis', path: '/motos' },
  ]);

  return (
    <div className="bg-zinc-950 min-h-screen pb-12 text-zinc-100">
      <JsonLd data={breadcrumbsSchema} id="catalog-breadcrumbs-schema" />
      {/* Header Banner */}
      <div className="bg-zinc-950 text-white pt-10 pb-5 md:py-14 border-b border-zinc-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Estoque Garantido {siteName}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Motos Disponíveis
              </h1>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                As melhores motos revisadas, com laudo cautelar aprovado e prontas para rodar.
              </p>
            </div>

            <div className="flex-shrink-0">
              <CatalogControls />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Results & Mobile Filter Trigger Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
              {motos.length}
            </span>
            <span className="text-sm text-zinc-400 font-semibold">
              {motos.length === 1 ? 'moto' : 'motos'}
            </span>
          </div>

          <MobileFiltersDrawer totalResults={motos.length} facets={facets} />
        </div>

        {/* Catalog Grid + Desktop Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start relative">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block md:col-span-1 sticky top-24 self-start">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <span className="text-sm font-extrabold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                  {motos.length} motos
                </span>
              </div>
              <MotorcycleFilters facets={facets} />
            </div>
          </aside>

          {/* Motorcycle Cards Grid */}
          <main className="md:col-span-3">
            <MotorcycleGrid
              motorcycles={motos}
              emptyMessage="Nenhuma moto encontrada com os filtros atuais. Tente ajustar a busca ou limpar os filtros."
              viewMode={currentView}
              whatsappPhone={settings?.whatsapp_phone}
              siteName={siteName}
            />
          </main>
        </div>
      </div>

      {/* Trust Bar Pre-Footer */}
      <div className="container mx-auto px-4 md:px-6 mt-16 mb-8 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1 */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 hover:border-amber-500/30 transition-colors rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1.5">Negociação Transparente</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Combinamos valores e condições de forma clara antes de qualquer decisão, sem
                surpresas.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 hover:border-amber-500/30 transition-colors rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1.5">Revisão</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                As motos passam por verificação prévia antes do anúncio, conforme a necessidade de
                cada veículo.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 hover:border-amber-500/30 transition-colors rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1.5">Documentação Clara</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Orientação e transparência quanto aos documentos da moto para uma transferência
                tranquila.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 hover:border-[#25D366]/30 transition-colors rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-[#25D366]"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-base mb-1.5">Atendimento Direto</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fale diretamente pelo WhatsApp para tirar dúvidas, agendar visita ou negociar sua
                moto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
