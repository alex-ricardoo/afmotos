import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Wrench,
  KeyRound,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Bike,
  Tag,
  Banknote,
  Clock,
  Megaphone,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { buttonVariants } from '@/components/ui/button';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { QuickSearch } from '@/components/filters/quick-search';
import { getFeaturedMotorcycles, getMotorcycleFilterFacets } from '@/lib/queries/motorcycles';
import { cn } from '@/lib/utils';
import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';

export default async function HomePage() {
  const [featuredMotos, facets, settings] = await Promise.all([
    getFeaturedMotorcycles(),
    getMotorcycleFilterFacets(),
    getSettings(),
  ]);

  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-16 overflow-hidden bg-[#050505] text-[#f4f4f2]">
      {/* 1. Hero Section - Refined for high photo visibility & WCAG AAA contrast */}
      <section className="relative w-full bg-zinc-950 text-white pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden border-b border-white/5">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-[url('/hero-mobile.jpg')] md:bg-[url('/hero.jpg')] bg-cover bg-center bg-no-repeat opacity-80 md:opacity-75"
          style={{ objectPosition: 'center 35%' }}
        />

        {/* Dark Radial Mask/Vignette Overlay for optimal typography legibility & WCAG AAA Contrast */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.95) 100%)',
          }}
        />

        {/* Subtle Brand Gold Ambient Glow */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl relative z-10 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Main Content Area */}
          <div className="max-w-3xl mx-auto text-center space-y-5 mb-10 md:mb-14 mt-2 md:mt-4">
            {/* Direct Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white font-heading">
              Encontre{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                sua próxima moto
              </span>
              .
            </h1>

            {/* Direct Transparent Subtitle */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Veja as motos disponíveis ou anuncie a sua com a {siteName}. Atendimento direto e
              transparente pelo WhatsApp.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link
                href="/motos"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                <span>Ver Estoque Completo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/anunciar-sua-moto"
                className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl px-6 py-3.5 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm text-sm"
              >
                Anuncie sua Moto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Search Floating Widget (Dynamic Facets from DB) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 md:-mt-16 relative z-20 w-full">
        <QuickSearch facets={facets} />
      </section>

      {/* 3. Featured Showcase */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-heading">
              Motos em destaque
            </h2>
            <p className="text-sm md:text-base text-[#a6a6a1] mt-1">
              Confira os modelos anunciados e fale diretamente com a gente no WhatsApp para saber
              mais.
            </p>
          </div>

          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden sm:inline-flex items-center font-bold text-[#e3c56c] hover:text-white hover:bg-[#c9a44c]/20 group',
            )}
          >
            <span>Ver todas as motos</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <MotorcycleGrid
          motorcycles={featuredMotos}
          emptyMessage="Nenhuma moto disponível no momento. Fale conosco pelo WhatsApp para saber sobre novas opções!"
          whatsappPhone={settings?.whatsapp_phone}
        />

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full font-bold h-11 rounded-xl border-[#c9a44c]/30 text-white bg-[#151515]',
            )}
          >
            Ver todas as motos
          </Link>
        </div>
      </section>

      {/* 4. Sell / List Motorcycle Spotlight Banner */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-r from-[#151515] via-[#1a1a1a] to-[#151515] rounded-3xl border border-[#c9a44c]/30 p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a44c]/15 border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Anúncio & Venda</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-heading">
              Quer vender sua moto?
            </h2>
            <p className="text-sm sm:text-base text-[#a6a6a1] leading-relaxed">
              Envie as informações e algumas fotos da sua moto. Vamos analisar os dados e conversar
              com você sobre os próximos passos para anunciar ou negociar.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start text-xs text-[#b8bcc2]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                <span>Combinamos preço e condições</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                <span>Atendimento direto pelo WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <Link
              href="/anunciar-sua-moto"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold h-13 px-8 rounded-xl shadow-md transition-all text-center cursor-pointer',
              )}
            >
              Anunciar minha moto
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Trust Pillars & Differentials Section (Honest & Transparent) */}
      <section className="bg-[#0d0d0d] py-16 md:py-20 border-y border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
              Transparência
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white font-heading">
              Como trabalhamos na {siteName}
            </h2>
            <p className="text-[#a6a6a1] text-sm sm:text-base mt-2">
              Negociação direta, honesta e sem complicações em cada etapa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Negociação Transparente</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Combinamos valores e condições de forma clara antes de qualquer decisão, sem
                surpresas.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Revisão quando Necessária</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                As motos passam por verificação prévia antes do anúncio, conforme a necessidade de
                cada veículo.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Documentação Clara</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Orientação e transparência quanto aos documentos da moto para uma transferência
                tranquila.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center font-bold">
                <WhatsAppIcon className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-lg font-bold text-white">Atendimento Direto</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Fale diretamente pelo WhatsApp para tirar dúvidas, agendar visita ou negociar sua
                moto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Services Section */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Nossos Serviços
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white font-heading">
            O que fazemos
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            Soluções completas para você comprar, vender ou alugar sua moto com facilidade e segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Card 1: Comprar */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Compre sua Moto</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Motos revisadas, com procedência garantida e documentação pronta para rodar sem dor de cabeça.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Motos inspecionadas e com garantia</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Facilidade no pagamento e financiamento</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-auto">
              <Link
                href="/motos"
                className="block w-full py-2.5 rounded-xl border border-zinc-700 text-center hover:bg-amber-500 hover:text-zinc-950 font-semibold text-sm transition-colors text-white"
              >
                Ver Motos Disponíveis
              </Link>
            </div>
          </div>

          {/* Card 2: Vender */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Venda sua Moto pra Nós</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Quer vender rápido? Avaliamos sua moto na hora e pagamos à vista no PIX com segurança total.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Avaliação justa e sem enrolação</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Pagamento imediato na conta</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-auto">
              <Link
                href="/anunciar-sua-moto"
                className="block w-full py-2.5 rounded-xl border border-zinc-700 text-center hover:bg-amber-500 hover:text-zinc-950 font-semibold text-sm transition-colors text-white"
              >
                Quero Vender Minha Moto
              </Link>
            </div>
          </div>

          {/* Card 3: Aluguel */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Aluguel de Motos</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Precisa de moto para trabalhar em entregas ou para o seu dia a dia? Alugue por semana ou mês.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Ideal para entregadores de app</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Manutenção preventiva inclusa</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-auto">
              <Link
                href="/aluguel"
                className="block w-full py-2.5 rounded-xl border border-zinc-700 text-center hover:bg-amber-500 hover:text-zinc-950 font-semibold text-sm transition-colors text-white"
              >
                Ver Planos de Aluguel
              </Link>
            </div>
          </div>

          {/* Card 4: Anúncio */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Anunciamos sua Moto</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Colocamos sua moto no nosso site e redes sociais. Cuidamos das mensagens e da negociação por uma comissão justa.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Você não se preocupa em atender curiosos</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Só paga a comissão quando a moto vender</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-auto">
              <Link
                href="/anunciar-sua-moto"
                className="block w-full py-2.5 rounded-xl border border-zinc-700 text-center hover:bg-amber-500 hover:text-zinc-950 font-semibold text-sm transition-colors text-white"
              >
                Anunciar com a Gente
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
