import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Clock,
} from 'lucide-react';
import { Metadata } from 'next';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { getMotorcycleBySlug, getFeaturedMotorcycles } from '@/lib/queries/motorcycles';
import { ImageCarousel } from '@/components/gallery/image-carousel';
import { MotorcycleSpecs } from '@/components/motorcycles/motorcycle-specs';
import { WhatsAppCTA } from '@/components/motorcycles/whatsapp-cta';
import {
  MotorcycleStatusBadge,
  MotorcycleStatus,
} from '@/components/motorcycles/motorcycle-status-badge';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { formatCurrency } from '@/lib/utils/format';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from '@/lib/utils/whatsapp';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const moto = await getMotorcycleBySlug(slug);

  if (!moto) {
    return { title: 'Moto não encontrada | AF Motos' };
  }

  const priceFormatted = moto.price ? ` - ${formatCurrency(moto.price)}` : '';
  const title = `${moto.brand} ${moto.model} ${moto.year_model}${priceFormatted} | AF Motos`;
  const description = moto.description
    ? moto.description.substring(0, 160)
    : `Confira a ${moto.brand} ${moto.model} (${moto.year_model}) na AF Motos. Negociação direta e atendimento pelo WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: moto.images?.[0] ? [moto.images[0].url] : [],
    },
  };
}

export default async function MotorcycleDetailPage({ params }: Props) {
  const { slug } = await params;
  const moto = await getMotorcycleBySlug(slug);

  if (!moto) {
    notFound();
  }

  const relatedMotos = (await getFeaturedMotorcycles())
    .filter((m) => m.slug !== moto.slug)
    .slice(0, 3);

  const images =
    moto.images?.length > 0
      ? moto.images
      : moto.image_url
        ? [{ id: 'main', url: moto.image_url }]
        : [];

  const mobileWhatsAppUrl = generateWhatsAppLink(
    CONSTANTS.CONTACT_PHONE,
    generateMotorcycleInterestMessage(moto),
  );

  return (
    <div className="bg-[#050505] min-h-screen pb-24 md:pb-16 text-[#f4f4f2]">
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
          {/* Left Column (8 cols): Gallery + Specs */}
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
              <WhatsAppCTA motorcycle={moto} />

              {/* Showroom / Visitação info */}
              <div className="pt-2 border-t border-[#c9a44c]/20 space-y-2 text-xs text-[#a6a6a1]">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <span>
                    Visitação e checagem da moto disponíveis com agendamento prévio pelo WhatsApp.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#e3c56c] shrink-0" />
                  <span>Segunda a Sexta das 08h às 18h | Sábado das 08h às 13h</span>
                </div>
              </div>
            </div>

            {/* Quality & Security Card */}
            <div className="bg-[#0d0d0d] text-white p-5 rounded-2xl border border-[#c9a44c]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
                <ShieldCheck className="w-4 h-4" />
                <span>Negociação Transparente</span>
              </div>
              <p className="text-xs text-[#b8bcc2] leading-relaxed">
                Tire suas dúvidas diretamente pelo WhatsApp antes de fechar qualquer negócio.
                Documentação e histórico conferidos para uma transferência tranquila.
              </p>
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

            <MotorcycleGrid motorcycles={relatedMotos} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Mobile Devices */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#050505]/95 backdrop-blur-md border-t border-[#c9a44c]/30 p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#a6a6a1] block leading-none">
            Valor
          </span>
          <span className="text-lg font-black text-[#e3c56c] tabular-nums">
            {moto.price ? formatCurrency(moto.price) : 'Consulte'}
          </span>
        </div>

        <a
          href={mobileWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm shadow-[0_0_15px_rgba(37,211,102,0.2)] transition-all"
        >
          <WhatsAppIcon className="w-4 h-4 fill-current" />
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
