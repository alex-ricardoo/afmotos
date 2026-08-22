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
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { buttonVariants } from '@/components/ui/button';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { QuickSearch } from '@/components/filters/quick-search';
import { getFeaturedMotorcycles } from '@/lib/queries/motorcycles';
import { cn } from '@/lib/utils';
import { getSettings } from '@/lib/actions/settings';

export default async function HomePage() {
  const featuredMotos = await getFeaturedMotorcycles();
  const settings = await getSettings();
  const siteName = settings?.site_name || 'AF Motos';

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-16 overflow-hidden bg-[#050505] text-[#f4f4f2]">
      {/* 1. Hero Section */}
      <section className="relative w-full bg-[#050505] text-white pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden border-b border-[#c9a44c]/20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-[url('/hero-mobile.jpg')] md:bg-[url('/hero.jpg')] bg-cover bg-center bg-no-repeat opacity-40 md:opacity-50" />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050505]/80 via-[#050505]/60 to-[#050505] pointer-events-none" />

        {/* Subtle automotive gold glow */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,164,76,0.25),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(184,188,194,0.08),transparent_40%)] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center">
          {/* Main Content Area (Text + CTAs) */}
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-12 md:mb-16 mt-4 md:mt-8">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white font-heading">
              Encontre sua próxima moto <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e6e8eb] to-[#e3c56c]">
                ou anuncie a sua.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#a6a6a1] max-w-2xl mx-auto leading-relaxed">
              Motos para comprar, alugar ou anunciar. Fale diretamente com a {siteName} pelo
              WhatsApp de forma simples e transparente.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href="/motos"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:w-auto bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold px-8 h-14 rounded-xl shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all',
                )}
              >
                <span>Ver motos disponíveis</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/consignar-moto"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'w-full sm:w-auto bg-[#151515] hover:bg-[#202020] text-white border-[#c9a44c]/30 hover:border-[#e3c56c] font-bold px-8 h-14 rounded-xl transition-all shadow-xs',
                )}
              >
                Quero anunciar minha moto
              </Link>
            </div>
          </div>

          {/* Direct & Honest Trust Highlights */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-[#c9a44c]/20 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-xl bg-[#151515]/60 border border-[#c9a44c]/20">
              <WhatsAppIcon className="w-5 h-5 text-[#25D366] fill-current shrink-0" />
              <span className="text-xs font-semibold text-[#f4f4f2]">
                Atendimento direto no WhatsApp
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-xl bg-[#151515]/60 border border-[#c9a44c]/20">
              <ShieldCheck className="w-5 h-5 text-[#e3c56c] shrink-0" />
              <span className="text-xs font-semibold text-[#f4f4f2]">Negociação transparente</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-xl bg-[#151515]/60 border border-[#c9a44c]/20">
              <Wrench className="w-5 h-5 text-[#e3c56c] shrink-0" />
              <span className="text-xs font-semibold text-[#f4f4f2]">Motos revisadas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Search Floating Widget */}
      <section className="container mx-auto px-4 md:px-6 -mt-16 md:-mt-20 relative z-20">
        <QuickSearch />
      </section>

      {/* 3. Featured Showcase */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e3c56c] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Em Destaque</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Motos disponíveis
            </h2>
            <p className="text-sm md:text-base text-[#a6a6a1] mt-1">
              Confira as motos anunciadas e fale com a gente para saber mais.
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
              href="/consignar-moto"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold h-13 px-8 rounded-xl shadow-md transition-all text-center',
              )}
            >
              Anunciar minha moto
            </Link>
            <Link
              href="/venda-sua-moto"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'bg-[#202020] hover:bg-[#282828] text-white border-[#c9a44c]/30 font-bold h-13 px-6 rounded-xl transition-all text-center',
              )}
            >
              Enviar dados para venda
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Trust Pillars & Differentials Section */}
      <section className="bg-[#0d0d0d] py-16 md:py-20 border-y border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
              Transparência
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white">
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
                As motos passam por uma revisão antes de serem anunciadas, conforme a necessidade de
                cada veículo.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Documentação em Dia</h3>
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
            Serviços
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white">
            O que fazemos
          </h2>
          <p className="text-[#a6a6a1] text-sm sm:text-base mt-2">
            Compra, venda, anúncio e locação de motos com atendimento dedicado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Locação */}
          <div className="relative group bg-[#151515] p-8 rounded-3xl border border-[#c9a44c]/20 shadow-sm flex flex-col justify-between hover:border-[#e3c56c]/50 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center">
                <Bike className="w-6 h-6 text-[#e3c56c]" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">
                Aluguel de Motos
              </h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Motos disponíveis para alugar por períodos flexíveis, para uso no dia a dia ou
                trabalho, com suporte e manutenção combinados.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Planos diários, semanais ou mensais</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Manutenção preventiva combinada</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/aluguel"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-between font-bold text-white bg-[#202020] border-[#c9a44c]/30 group-hover:bg-[#c9a44c] group-hover:text-black group-hover:border-[#c9a44c] transition-all rounded-xl h-11',
                )}
              >
                <span>Ver Opções de Aluguel</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Anuncie sua Moto */}
          <div className="relative group bg-[#151515] p-8 rounded-3xl border-2 border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.15)] flex flex-col justify-between hover:shadow-[0_0_30px_rgba(201,164,76,0.25)] transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c9a44c] text-black flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">
                Anuncie sua Moto
              </h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Quer vender sua moto? A gente ajuda a encontrar um comprador, divulga o anúncio e
                organiza o contato com os interessados.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Você participa da definição do valor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Divulgação para interessados reais</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/consignar-moto"
                className={cn(
                  buttonVariants(),
                  'w-full justify-between bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold rounded-xl h-11 shadow-sm',
                )}
              >
                <span>Anunciar Minha Moto</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Venda sua Moto */}
          <div className="relative group bg-[#151515] p-8 rounded-3xl border border-[#c9a44c]/20 shadow-sm flex flex-col justify-between hover:border-[#e3c56c]/50 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#e3c56c]" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">Venda sua Moto</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Envie os dados e fotos da sua moto. Vamos analisar as informações e conversar com
                você sobre a possibilidade de negociação.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Análise simples das informações</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Conversa direta pelo WhatsApp</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/venda-sua-moto"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-between font-bold text-white bg-[#202020] border-[#c9a44c]/30 group-hover:bg-[#c9a44c] group-hover:text-black group-hover:border-[#c9a44c] transition-all rounded-xl h-11',
                )}
              >
                <span>Enviar Dados da Moto</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
