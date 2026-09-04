import React from 'react';
import {
  ShieldCheck,
  Wrench,
  FileCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Bike,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import {
  MotorcycleFilters,
  MobileFiltersDrawer,
  CatalogControls,
} from '@/components/filters/motorcycle-filters';
import { getAllMotorcycles, getMotorcycleFilterFacets } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import {
  buildPageMetadata,
  JsonLd,
  buildBreadcrumbsSchema,
  buildFaqSchema,
  SEO_CONFIG,
} from '@/lib/seo';

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

  const currentView =
    typeof resolvedParams.view === 'string' && resolvedParams.view === 'list' ? 'list' : 'grid';

  const customOrderWhatsappUrl = generateWhatsAppLink(
    settings?.whatsapp_phone,
    `Olá! Estou buscando uma moto específica no estoque da ${siteName} e gostaria de saber se vocês têm ou conseguem para mim.`,
  );

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Motos Disponíveis', path: '/motos' },
  ]);

  const faqSchema = buildFaqSchema([
    {
      question: `As motos do estoque da ${siteName} possuem garantia?`,
      answer:
        'Sim! Todas as motocicletas comercializadas pela nossa loja contam com garantia legal de 90 dias para motor e câmbio, além de rigorosa revisão mecânica pré-entrega.',
    },
    {
      question: `As motos têm laudo cautelar aprovado?`,
      answer:
        'Sim, 100% das motos do nosso estoque possuem consulta veicular e laudo cautelar aprovado, garantindo procedência limpa, sem sinistro ou passagem por leilão.',
    },
    {
      question: 'A AF Motos aceita moto usada na troca?',
      answer:
        'Sim! Aceitamos sua moto usada como parte do pagamento com avaliação justa e transparente baseada na Tabela FIPE e no estado real de conservação.',
    },
    {
      question: 'Quais as formas de pagamento disponíveis?',
      answer:
        'Trabalhamos com pagamento à vista via PIX ou transferência, financiamento bancário com as melhores taxas do mercado e parcelamento facilitado no cartão de crédito em até 21x.',
    },
  ]);

  return (
    <div className="bg-zinc-950 min-h-screen pb-20 text-zinc-100">
      <JsonLd data={breadcrumbsSchema} id="catalog-breadcrumbs-schema" />
      <JsonLd data={faqSchema} id="catalog-faq-schema" />

      {/* Ultra-Compact Top Bar: Title, Count, Mobile Filter Trigger & Desktop Controls */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-20 z-30 shadow-xs">
        <div className="container mx-auto px-3 sm:px-6 max-w-7xl py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2.5">
            {/* Title & Live Count */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-black text-white font-heading tracking-tight whitespace-nowrap">
                Motos Disponíveis
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">
                  {motos.length} {motos.length === 1 ? 'moto' : 'motos'}
                </span>
                <span className="xs:hidden">{motos.length}</span>
              </span>
            </div>

            {/* Actions: Mobile Filters Drawer Button & Desktop Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="md:hidden">
                <MobileFiltersDrawer totalResults={motos.length} facets={facets} />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <CatalogControls />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-3 sm:px-6 pt-2.5 pb-8 md:py-8 max-w-7xl">
        {/* Catalog Grid + Desktop Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-start relative">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block md:col-span-1 sticky top-36 self-start">
            <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-zinc-800/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Filtros
                </span>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {motos.length} resultados
                </span>
              </div>
              <MotorcycleFilters facets={facets} />
            </div>
          </aside>

          {/* Motorcycle Cards Grid */}
          <main className="md:col-span-3">
            <MotorcycleGrid
              motorcycles={motos}
              emptyMessage="Nenhuma moto encontrada com os filtros selecionados. Tente ajustar os termos ou limpar os filtros."
              viewMode={currentView}
              whatsappPhone={settings?.whatsapp_phone}
              siteName={siteName}
            />
          </main>
        </div>

        {/* Custom Order Callout Box VIP */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-8 sm:p-10 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-black/70 mt-16">
          {/* Subtle Top Gold Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 text-center md:text-left max-w-xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Não encontrou seu modelo ideal?</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Nós encontramos a moto certa para você!
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Fale com a nossa equipe pelo WhatsApp. Diga o modelo, ano ou faixa de valor que você
              procura. Avisamos você em primeira mão assim que uma unidade do seu interesse entrar no estoque.
            </p>
          </div>

          <a
            href={customOrderWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full md:w-auto bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold rounded-2xl px-7 h-14 shadow-[0_0_25px_rgba(37,211,102,0.3)] hover:shadow-[0_0_35px_rgba(37,211,102,0.45)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 shrink-0 transition-all cursor-pointer relative z-10',
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <WhatsAppIcon className="w-5 h-5 fill-current" />
            <span>Encomendar Minha Moto</span>
          </a>
        </div>

        {/* Institutional Trust Pillars Bar */}
        <div className="pt-10 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">
              Por que comprar na {siteName}?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Procedência garantida, revisão minuciosa e atendimento transparente para você realizar seu sonho com total segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Pillar 1 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-emerald-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Laudo & Procedência 100%
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Todas as motos possuem consulta cautelar rigorosa, assegurando procedência limpa, sem sinistro ou passagem por leilão.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Revisão Mecânica & Garantia
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mecânica, parte elétrica, freios e pneus inspecionados com garantia de 90 dias para você rodar com total segurança.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Transferência sem Burocracia
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cuidamos de toda a documentação no DETRAN para que a transferência de propriedade ocorra com total tranquilidade.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Financiamento & Troca Justa
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Parcelamento em até 21x no cartão, opções de financiamento bancário e a melhor avaliação na troca da sua moto seminova.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
