import React from 'react';
import Link from 'next/link';
import { History, Sparkles, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { getSoldMotorcycles } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { buttonVariants } from '@/components/ui/button';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import { buildPageMetadata, JsonLd, buildBreadcrumbsSchema, SEO_CONFIG } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  return buildPageMetadata({
    title: `Motos Vendidas | ${siteName}`,
    description: `Confira o histórico de motos já negociadas pela ${siteName} em Cabo de Santo Agostinho - PE. Qualidade, transparência e satisfação garantida.`,
    path: '/motos-vendidas',
  });
}

export default async function MotosVendidasPage() {
  const [motorcycles, settings] = await Promise.all([getSoldMotorcycles(), getSettings()]);

  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  const customOrderWhatsappUrl = generateWhatsAppLink(
    settings?.whatsapp_phone,
    `Olá! Vi um modelo na lista de motos vendidas da ${siteName} e gostaria de saber se há previsão de alguma similar.`,
  );

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Motos Vendidas', path: '/motos-vendidas' },
  ]);

  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      <JsonLd data={breadcrumbsSchema} id="motos-vendidas-breadcrumbs-schema" />
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <History className="w-4 h-4 text-[#e3c56c]" />
            <span>Histórico de Negociações</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Motos Já Negociadas
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Confira as motocicletas que já passaram por aqui e foram entregues aos seus novos donos
            com total transparência.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-4 md:px-6 py-12 space-y-12">
        <div className="flex items-center justify-between pb-4 border-b border-[#c9a44c]/20">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Motos Entregues</h2>
            <p className="text-xs text-[#a6a6a1]">
              {motorcycles.length}{' '}
              {motorcycles.length === 1
                ? 'motocicleta no histórico'
                : 'motocicletas no histórico recente'}
            </p>
          </div>

          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'hidden sm:inline-flex rounded-xl font-bold text-xs h-10 px-4 bg-[#151515] border-[#c9a44c]/30 text-white hover:bg-[#c9a44c] hover:text-black transition-all',
            )}
          >
            <span>Ver Motos Disponíveis</span>
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Link>
        </div>

        <MotorcycleGrid
          motorcycles={motorcycles}
          emptyMessage="O histórico de motos vendidas está sendo atualizado."
          whatsappPhone={settings?.whatsapp_phone}
          siteName={siteName}
        />

        {/* Custom Order Callout Box */}
        <div className="bg-[#151515] text-white p-8 rounded-3xl border border-[#c9a44c]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="w-4 h-4" />
              Procura um modelo específico?
            </span>
            <h3 className="text-2xl font-black tracking-tight text-white font-heading">
              Gostou de algum modelo que já foi vendido?
            </h3>
            <p className="text-xs sm:text-sm text-[#a6a6a1] leading-relaxed">
              Fale com a gente no WhatsApp. Se você procura um modelo ou faixa de valor específica,
              podemos avisar você quando surgir uma oportunidade.
            </p>
          </div>

          <a
            href={customOrderWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full md:w-auto bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl px-6 h-12 shadow-[0_0_15px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2 shrink-0 transition-all',
            )}
          >
            <WhatsAppIcon className="w-5 h-5 fill-current" />
            <span>Falar sobre Modelo Similar</span>
          </a>
        </div>
      </div>
    </div>
  );
}
