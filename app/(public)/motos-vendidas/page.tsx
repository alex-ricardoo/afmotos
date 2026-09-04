import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Wrench,
  HeartHandshake,
  ArrowRight,
  Bike,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { getSoldMotorcycles } from '@/lib/queries/motorcycles';
import { getSettings } from '@/lib/actions/settings';
import { SoldMotorcyclesClient } from '@/components/motorcycles/sold-motorcycles-client';
import { buttonVariants } from '@/components/ui/button';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import {
  buildPageMetadata,
  JsonLd,
  buildBreadcrumbsSchema,
  buildFaqSchema,
  SEO_CONFIG,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  return buildPageMetadata({
    title: `Motos Vendidas & Entregas Realizadas | ${siteName}`,
    description: `Confira o histórico de motos já negociadas pela ${siteName} em Cabo de Santo Agostinho - PE. Veículos entregues com laudo cautelar aprovado, procedência garantida e total transparência.`,
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

  const faqSchema = buildFaqSchema([
    {
      question: `Posso encomendar um modelo similar ao que já foi vendido pela ${siteName}?`,
      answer:
        `Sim! Se você gostou de algum modelo que já foi vendido, basta falar conosco no WhatsApp. Anotamos o ano, modelo e faixa de preço de sua preferência e avisamos em primeira mão assim que uma unidade similar chegar ao estoque.`,
    },
    {
      question: `As motos vendidas pela ${siteName} têm procedência verificada?`,
      answer:
        `Sim, 100% das motocicletas negociadas pela ${siteName} passam por verificação de histórico veicular, laudo cautelar e checagem minuciosa de procedência antes de serem entregues aos novos donos.`,
    },
    {
      question: 'Como funciona o processo de transferência no DETRAN?',
      answer:
        'Cuidamos de toda a orientação e comunicação formal de venda no DETRAN para garantir total tranquilidade jurídica e segurança tanto para o comprador quanto para o vendedor.',
    },
  ]);

  return (
    <div className="bg-zinc-950 min-h-screen pb-20 text-zinc-100">
      <JsonLd data={breadcrumbsSchema} id="motos-vendidas-breadcrumbs-schema" />
      <JsonLd data={faqSchema} id="motos-vendidas-faq-schema" />

      {/* Header Hero Section com Luxury Dark Gradient & Radial Glow */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-16 sm:py-20 border-b border-zinc-800/80">
        {/* Ambient Gold Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Histórico de Entregas & Confiança</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Motos Já Negociadas
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto font-normal">
            Mais do que motos vendidas: histórias de clientes satisfeitos, negociações transparentes
            e sonhos realizados com a qualidade da {siteName}.
          </p>

          {/* Quick Stats / Proof Pillars */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-zinc-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Bike className="w-3.5 h-3.5 text-amber-400" />
              <span>{motorcycles.length} motos entregues com sucesso</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% com Laudo & Procedência</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Revisão completa de entrega</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid & Filters Area */}
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-6xl space-y-16">
        <SoldMotorcyclesClient
          motorcycles={motorcycles}
          whatsappPhone={settings?.whatsapp_phone}
          siteName={siteName}
        />

        {/* Custom Order Callout Box VIP */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-8 sm:p-10 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-black/70">
          {/* Subtle Top Gold Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 text-center md:text-left max-w-xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Atendimento VIP & Encomendas</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Gostou de algum modelo que já foi vendido?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Fale com a nossa equipe no WhatsApp! Se você procura um ano, modelo ou faixa de preço
              específica, nós cadastramos sua preferência e avisamos você em primeira mão assim que
              uma oportunidade similar chegar à loja.
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
            <span>Falar sobre Modelo Similar</span>
          </a>
        </div>

        {/* Institutional Trust Pillars Bar */}
        <div className="pt-6 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">
              O Padrão de Qualidade da {siteName}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Conheça os pilares que garantem a satisfação e segurança dos clientes em cada moto entregue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Pillar 1 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Laudo & Procedência
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cada motocicleta passa por consulta de histórico e laudo cautelar para assegurar origem 100% legal e transparente.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Revisão Minuciosa
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mecânica, parte elétrica e itens de segurança são rigorosamente inspecionados antes da entrega final ao comprador.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Transferência Segura
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cuidamos de todos os procedimentos no DETRAN para que a transferência ocorra sem pendências ou transtornos futuros.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-emerald-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Satisfação Comprovada
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Centenas de motociclistas satisfeitos em Pernambuco, com negociação ágil, honesta e atendimento de excelência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

