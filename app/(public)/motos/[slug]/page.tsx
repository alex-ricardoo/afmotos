import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ArrowLeft, MapPin, Clock, BadgeCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { getMotorcycleBySlug, getFeaturedMotorcycles } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { ImageCarousel } from '@/components/gallery/image-carousel';
import { MotorcycleSpecs } from '@/components/motorcycles/motorcycle-specs';
import { WhatsAppCTA } from '@/components/motorcycles/whatsapp-cta';
import {
  MotorcycleStatusBadge,
  MotorcycleStatus,
} from '@/components/motorcycles/motorcycle-status-badge';
import { MotorcycleGrid, MotorcycleGridSkeleton } from '@/components/motorcycles/motorcycle-grid';
import { formatCurrency } from '@/lib/utils/format';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from '@/lib/utils/whatsapp';
import { getBusinessHours, getMapsUrl } from '@/lib/site-settings';
import { MotorcycleShareSection } from '@/components/motorcycles/motorcycle-share-section';
import { getPublicMotorcycleUrl } from '@/lib/utils/share';
import { PaymentMethods } from '@/components/ui/payment-methods';
import {
  buildPageMetadata,
  JsonLd,
  buildMotorcycleProductSchema,
  buildBreadcrumbsSchema,
  formatMotorcycleTitle,
  formatMotorcycleDescription,
  SEO_CONFIG,
} from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [moto, settings] = await Promise.all([getMotorcycleBySlug(slug), getSettings()]);

  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  if (!moto || moto.status === 'HIDDEN') {
    return {
      title: 'Moto não encontrada',
      description: 'A motocicleta solicitada não está disponível no momento.',
      robots: { index: false, follow: true },
    };
  }

  const isSold = moto.status === 'SOLD';
  const title = formatMotorcycleTitle(moto);
  const description = formatMotorcycleDescription(moto, siteName);
  const primaryImage = moto.images?.[0]?.url || moto.image_url || null;

  return buildPageMetadata({
    title,
    description,
    path: `/motos/${moto.slug}`,
    ogImage: primaryImage,
    ogType: 'website',
    noIndex: isSold,
  });
}

export default async function MotorcycleDetailPage({ params }: Props) {
  const { slug } = await params;
  const [moto, allFeatured, settings] = await Promise.all([
    getMotorcycleBySlug(slug),
    getFeaturedMotorcycles(),
    getSettings(),
  ]);

  if (!moto || moto.status === 'HIDDEN') {
    notFound();
  }

  const whatsappPhone = settings?.whatsapp_phone;
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const businessHours = getBusinessHours(settings);
  const addressText =
    settings?.address ||
    'Visitação e checagem da moto disponíveis com agendamento prévio pelo WhatsApp.';
  const mapsUrl = getMapsUrl(settings);

  const relatedMotos = allFeatured.filter((m) => m.slug !== moto.slug).slice(0, 3);

  const images =
    moto.images?.length > 0
      ? moto.images
      : moto.image_url
        ? [{ id: 'main', url: moto.image_url }]
        : [];

  const mobileWhatsAppUrl = generateWhatsAppLink(
    whatsappPhone,
    generateMotorcycleInterestMessage(moto),
  );

  const productSchema = buildMotorcycleProductSchema(moto, siteName);
  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Motos Disponíveis', path: '/motos' },
    { name: `${moto.brand} ${moto.model}`, path: `/motos/${moto.slug}` },
  ]);

  return (
    <div className="bg-[#050505] min-h-screen pb-24 md:pb-16 text-[#f4f4f2]">
      <JsonLd data={productSchema} id="motorcycle-product-schema" />
      <JsonLd data={breadcrumbsSchema} id="motorcycle-breadcrumbs-schema" />
      {/* Breadcrumb Bar */}
      <div className="border-b border-[#c9a44c]/20 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between text-xs text-[#a6a6a1]">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link href="/" className="hover:text-white transition-colors font-medium">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#c9a44c]/60" />
            <Link href="/motos" className="hover:text-white transition-colors font-medium">
              Motos disponíveis
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#c9a44c]/60" />
            <span className="text-white font-bold truncate max-w-[200px] sm:max-w-none">
              {moto.brand} {moto.model}
            </span>
          </div>

          <Link
            href="/motos"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#e3c56c] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Motos</span>
          </Link>
        </div>
      </div>

      {/* Main Vehicle Showcase */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (8 cols): Gallery + Specs + Share Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Gallery */}
            <ImageCarousel images={images} />

            {/* Mobile Title (visible on mobile only) */}
            <div className="lg:hidden space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#c9a44c]">
                  {moto.brand}
                </span>
                <MotorcycleStatusBadge status={moto.status as MotorcycleStatus} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
                {moto.model}
              </h1>
              {moto.version && <p className="text-sm text-[#a6a6a1] font-medium">{moto.version}</p>}
              <div className="text-3xl font-black text-[#e3c56c] tabular-nums tracking-tight pt-1">
                {moto.price ? formatCurrency(moto.price) : 'Consulte'}
              </div>
            </div>

            {/* Technical Specifications */}
            <MotorcycleSpecs motorcycle={moto} />

            {/* Dedicated Motorcycle Sharing Section */}
            <MotorcycleShareSection
              motorcycle={moto}
              whatsappPhone={whatsappPhone}
              siteName={siteName}
            />
          </div>

          {/* Right Column (4 cols): Sticky Summary Card & Lead Box */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-28 space-y-6">
            <div className="bg-[#151515] rounded-3xl p-6 sm:p-7 border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-6">
              {/* Header Info */}
              <div className="space-y-2 pb-4 border-b border-[#c9a44c]/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#c9a44c]">
                    {moto.brand}
                  </span>
                  <MotorcycleStatusBadge status={moto.status as MotorcycleStatus} />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug font-heading">
                  {moto.model}
                </h1>

                {moto.version && (
                  <p className="text-sm text-[#a6a6a1] font-medium">{moto.version}</p>
                )}
              </div>

              {/* Price Display */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b8bcc2]">
                  Preço
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#e3c56c] tabular-nums tracking-tight">
                  {moto.price ? formatCurrency(moto.price) : 'Sob Consulta'}
                </div>
                <p className="text-xs text-[#a6a6a1]">
                  Negociação direta com o vendedor. Fale pelo WhatsApp para mais informações.
                </p>
              </div>

              {/* Formas de Pagamento */}
              <PaymentMethods variant="full" />

              {/* Selos de Garantia, Revisão e Histórico */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-black text-emerald-300">
                      Histórico Veicular Verificado
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      Todas as motos da {siteName} possuem laudo de procedência 100% checado.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5">
                  <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-black text-amber-300">
                      Garantia de 90 dias
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      Cobre motor e câmbio por 90 dias.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5">
                  <ClipboardCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-black text-amber-300">Moto revisada</span>
                    <span className="block text-[10px] text-zinc-400">
                      Verificada antes de chegar até você.
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Quick Stats */}
              <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-[#0d0d0d] rounded-2xl text-center text-xs font-bold text-white border border-[#c9a44c]/15">
                <div>
                  <span className="text-[10px] text-[#a6a6a1] block font-medium">Ano</span>
                  <span className="tabular-nums">
                    {moto.year_manufacture}/{moto.year_model}
                  </span>
                </div>
                <div className="border-x border-[#c9a44c]/15">
                  <span className="text-[10px] text-[#a6a6a1] block font-medium">KM</span>
                  <span className="tabular-nums">
                    {moto.mileage !== null && moto.mileage !== undefined
                      ? `${moto.mileage.toLocaleString('pt-BR')} km`
                      : '0 km'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#a6a6a1] block font-medium">Motor</span>
                  <span className="tabular-nums">
                    {moto.engine_capacity ? `${moto.engine_capacity}cc` : 'Flex'}
                  </span>
                </div>
              </div>

              {/* WhatsApp Conversion CTAs */}
              <WhatsAppCTA motorcycle={moto} whatsappPhone={whatsappPhone} />

              {/* Showroom / Visitação & Horários Dinâmicos */}
              <div className="pt-2 border-t border-[#c9a44c]/20 space-y-2 text-xs text-[#a6a6a1]">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <div>
                    <span>{addressText}</span>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[#e3c56c] font-semibold hover:underline mt-0.5"
                      >
                        Ver no Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p>{businessHours.weekdays}</p>
                    <p>{businessHours.saturday}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Motorcycles Showcase */}
        {relatedMotos.length > 0 && (
          <div className="mt-16 sm:mt-20 pt-12 border-t border-[#c9a44c]/20 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
                  Mais Opções
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                  Outras Motos Disponíveis
                </h2>
              </div>
              <Link
                href="/motos"
                className="hidden sm:inline-flex text-xs font-bold text-[#e3c56c] hover:text-white"
              >
                Ver todas as motos &rarr;
              </Link>
            </div>

            <React.Suspense fallback={<MotorcycleGridSkeleton count={3} />}>
              <MotorcycleGrid
                motorcycles={relatedMotos}
                whatsappPhone={whatsappPhone}
                siteName={siteName}
              />
            </React.Suspense>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Mobile Devices */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 p-4 pb-safe flex items-center justify-between gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#a6a6a1] block leading-none">
            Valor de
          </span>
          <span className="text-xl font-black text-[#e3c56c] tabular-nums mt-0.5">
            {moto.price ? formatCurrency(moto.price) : 'Consulte'}
          </span>
        </div>

        <a
          href={mobileWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 max-w-[200px] flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all active:scale-[0.98]"
        >
          <WhatsAppIcon className="w-5 h-5 fill-current" />
          <span>Falar com Vendedor</span>
        </a>
      </div>
    </div>
  );
}
