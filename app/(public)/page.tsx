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
  Megaphone,
  BadgeCheck,
  ClipboardCheck,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { buttonVariants } from '@/components/ui/button';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { QuickSearch } from '@/components/filters/quick-search';
import { getFeaturedMotorcycles, getMotorcycleFilterFacets } from '@/lib/queries/motorcycles';
import { cn } from '@/lib/utils';
import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { PaymentMethods } from '@/components/ui/payment-methods';

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
              Veja as motos disponíveis ou anuncie a sua com a {siteName}. Todas revisadas,{' '}
              <span className="text-amber-400 font-semibold">com garantia de 90 dias</span> e atendimento direto pelo WhatsApp.
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
          siteName={siteName}
        />

        {/* Payment Methods Strip */}
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-amber-950/20 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-lg">
                💳
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                  Facilidades para comprar
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">Escolha a melhor forma para você</p>
              </div>
            </div>
            <PaymentMethods variant="compact" className="justify-center lg:justify-end" />
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4 text-[10px] text-zinc-400 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-end">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Cartão em até <span className="font-bold text-amber-300">18x</span> com acréscimo da maquineta
            </span>
            <span className="hidden text-zinc-700 sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Financiamento sujeito à análise e aprovação
            </span>
            <span className="hidden text-zinc-700 sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Aceitamos sua moto como entrada mediante avaliação
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1810] via-[#141414] to-[#0d0d0d] border border-amber-500/30 p-8 sm:p-10 md:p-14 shadow-2xl shadow-black/80">
          {/* Subtle Ambient Golden Gradients & Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(227,197,108,0.06),transparent_70%)] pointer-events-none" />

          {/* Decorative watermark icon */}
          <div className="absolute right-4 bottom-[-20px] opacity-[0.03] text-amber-400 pointer-events-none select-none hidden lg:block">
            <Bike className="w-96 h-96" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline, Description & Features */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Floating Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 text-xs font-extrabold text-amber-400 shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Venda Rápida ou Anúncio Fácil</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-heading leading-tight">
                  Quer vender ou anunciar{' '}
                  <span className="bg-gradient-to-r from-[#fef08a] via-[#e3c56c] to-[#c9a44c] bg-clip-text text-transparent">
                    sua moto?
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Na {siteName} você escolhe o melhor caminho: a gente compra a sua moto à vista com pagamento no PIX, ou coloca para anunciar no nosso site para vender rápido e sem dor de cabeça.
                </p>
              </div>

              {/* Benefit Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-zinc-300">
                <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="font-medium text-zinc-200">Pagamento rápido à vista no PIX</span>
                </div>

                <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="font-medium text-zinc-200">Avaliação justa e na hora</span>
                </div>

                <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="font-medium text-zinc-200">Divulgação para centenas de compradores</span>
                </div>

                <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  </div>
                  <span className="font-medium text-zinc-200">Atendimento direto pelo WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Action Box */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-zinc-950/85 border border-amber-500/25 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-5 text-center">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                    100% Gratuito & Sem Compromisso
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Escolha como quer negociar
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Envie os dados e fotos da sua moto em menos de 2 minutos.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Opção 1: Vender para a Loja */}
                  <Link
                    href="/vender-minha-moto"
                    className="w-full bg-gradient-to-r from-[#fef08a] via-[#e3c56c] to-[#c9a44c] hover:opacity-95 text-zinc-950 font-black h-12 px-5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm group cursor-pointer"
                  >
                    <span>Quero Vender Minha Moto</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Opção 2: Anunciar no Site */}
                  <Link
                    href="/anunciar-sua-moto"
                    className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-amber-300 font-bold h-11 px-5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xs cursor-pointer shadow-sm"
                  >
                    <span>Quero Anunciar no Site</span>
                  </Link>

                  {/* Opção 3: WhatsApp */}
                  <a
                    href={generateWhatsAppLink(
                      settings?.whatsapp_phone,
                      `Olá! Gostaria de conversar sobre a venda ou anúncio da minha moto com a ${siteName}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-zinc-400 hover:text-emerald-400 font-medium py-1.5 flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    <span>Prefiro conversar pelo WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trust Pillars & Differentials Section */}
      <section className="bg-[#0d0d0d] py-16 md:py-20 border-y border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6">

          {/* Guarantee Banner — destaque de 90 dias */}
          <div className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
              {/* Ícone grande */}
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <BadgeCheck className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400" />
              </div>
              {/* Texto */}
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                  Compre com tranquilidade
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Garantia de 90 dias em todas as motos
                </h3>
                <p className="text-sm text-zinc-400 max-w-xl">
                  Toda moto vendida pela {siteName} passa por revisão antes de ir para o comprador
                  e sai com <span className="text-amber-400 font-semibold">3 meses de garantia</span>{' '}
                  no motor e câmbio.
                </p>
              </div>
              {/* Badges */}
              <div className="shrink-0 flex sm:flex-col gap-3">
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300 whitespace-nowrap">Revisada</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300 whitespace-nowrap">90 dias garantia</span>
                </div>
              </div>
            </div>
          </div>

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

            {/* Pillar 2 — Revisão + Garantia */}
            <div className="bg-gradient-to-b from-amber-500/10 to-[#151515] p-6 rounded-2xl border border-amber-500/30 shadow-xs space-y-3 hover:border-amber-400/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Revisada e com Garantia</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Toda moto é revisada antes da venda e sai com{' '}
                <span className="text-amber-400 font-semibold">90 dias de garantia</span>.
                Você compra sabendo o que está levando.
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
            Soluções completas para você comprar, vender ou anunciar sua moto com facilidade e
            segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Comprar */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Compre sua Moto</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Motos revisadas, com procedência garantida e documentação pronta para rodar sem dor
                de cabeça.
              </p>
              {/* Selo de garantia */}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300">Garantia de 90 dias</span>
              </div>
              <ul className="space-y-2 pt-1">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Toda moto é revisada antes da venda</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Financiamento para facilitar sua compra, sujeito à análise e aprovação
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Aceitamos sua moto como entrada mediante avaliação</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Documentação em dia, IPVA pago e pronta para transferir</span>
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
              <h3 className="text-xl font-bold text-white tracking-tight">
                Venda sua Moto pra Nós
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Quer vender rápido? Avaliamos sua moto na hora e pagamos à vista no PIX com
                segurança total.
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
                href="/vender-minha-moto"
                className="block w-full py-2.5 rounded-xl border border-zinc-700 text-center hover:bg-amber-500 hover:text-zinc-950 font-semibold text-sm transition-colors text-white"
              >
                Quero Vender Minha Moto
              </Link>
            </div>
          </div>

          {/* Card 3: Anúncio */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl inline-flex w-fit">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Anunciamos sua Moto</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Colocamos sua moto no nosso site e redes sociais. Cuidamos das mensagens e da
                negociação por uma comissão justa.
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
