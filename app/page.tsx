import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Award,
  Banknote,
  KeyRound,
  BadgeCheck,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Bike,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { QuickSearch } from '@/components/filters/quick-search';
import { getFeaturedMotorcycles } from '@/lib/queries/motorcycles';
import { cn } from '@/lib/utils';

export default async function HomePage() {
  const featuredMotos = await getFeaturedMotorcycles();

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-16 overflow-hidden bg-[#050505] text-[#f4f4f2]">
      {/* 1. Hero Section */}
      <section className="relative w-full bg-[#050505] text-white pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-[#c9a44c]/20">
        {/* Subtle automotive gold glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,164,76,0.18),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(184,188,194,0.06),transparent_40%)] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Guarantee Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/40 text-xs font-bold tracking-wide text-[#e3c56c] backdrop-blur-xs shadow-[0_0_12px_rgba(201,164,76,0.15)]">
              <BadgeCheck className="w-4 h-4 text-[#e3c56c]" />
              <span>Procedência Garantida & Laudo Cautelar 100% Aprovado</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white font-heading">
              Sua próxima conquista <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e6e8eb] to-[#e3c56c]">
                sobre duas rodas.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#a6a6a1] max-w-2xl mx-auto leading-relaxed">
              Concessionária premium especializada em locação, venda e consignação de
              motocicletas selecionadas com rigor técnico e garantia total.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/motos"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:w-auto bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all'
                )}
              >
                <span>Ver Estoque Completo</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/venda-sua-moto"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'w-full sm:w-auto bg-[#151515] hover:bg-[#202020] text-white border-[#c9a44c]/30 hover:border-[#e3c56c] font-bold px-8 h-12 rounded-xl transition-all shadow-xs'
                )}
              >
                Vender ou Consignar
              </Link>
            </div>

            {/* Stat Counters / Micro Social Proof */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#c9a44c]/20 max-w-lg mx-auto text-center">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  +500
                </p>
                <p className="text-xs text-[#a6a6a1] font-medium">
                  Motos Entregues
                </p>
              </div>
              <div className="border-x border-[#c9a44c]/20 px-2">
                <p className="text-xl sm:text-2xl font-black text-[#e3c56c] tabular-nums">
                  100%
                </p>
                <p className="text-xs text-[#a6a6a1] font-medium">
                  Laudo Cautelar
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  Nota 5.0
                </p>
                <p className="text-xs text-[#a6a6a1] font-medium">
                  Avaliação Clientes
                </p>
              </div>
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
              <span>Seleção Premium</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Motos em Destaque
            </h2>
            <p className="text-sm md:text-base text-[#a6a6a1] mt-1">
              Oportunidades exclusivas revisadas e prontas para entrega imediata.
            </p>
          </div>

          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hidden sm:inline-flex items-center font-bold text-[#e3c56c] hover:text-white hover:bg-[#c9a44c]/20 group'
            )}
          >
            <span>Explorar todo o catálogo</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <MotorcycleGrid
          motorcycles={featuredMotos}
          emptyMessage="Nenhuma moto em destaque no momento. Confira nosso estoque completo!"
        />

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full font-bold h-11 rounded-xl border-[#c9a44c]/30 text-white bg-[#151515]'
            )}
          >
            Ver todas as motos
          </Link>
        </div>
      </section>

      {/* 4. Trust Pillars & Differentials Section */}
      <section className="bg-[#0d0d0d] py-16 md:py-20 border-y border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
              Padrão de Excelência
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white">
              Por que escolher a AF Locações e Vendas?
            </h2>
            <p className="text-[#a6a6a1] text-sm sm:text-base mt-2">
              Segurança jurídica, técnica e comercial em cada etapa da sua negociação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Laudo Cautelar 100%</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Todas as motos passam por perícia técnica cautelar, atestando originalidade e histórico limpo.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Revisão Completa</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Checagem minuciosa de freios, suspensão, pneus, bateria e motor antes de cada entrega.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Pagamento Imediato</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Compramos sua moto à vista via PIX com avaliação justa baseada na cotação real de mercado.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 hover:border-[#e3c56c]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Melhores Taxas</h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Parcerias bancárias diretas com aprovação rápida de crédito e parcelamento sob medida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Split Service Blocks */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
            Soluções Completas
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white">
            Conheça Nossos Serviços
          </h2>
          <p className="text-[#a6a6a1] text-sm sm:text-base mt-2">
            Da locação flexível à compra e consignação com alto retorno.
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
                Motos revisadas com manutenção inclusa para viagens, compromissos urbanos ou trabalho com planos diários, semanais e mensais.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Planos flexíveis sob medida</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Manutenção preventiva inclusa</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/aluguel"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-between font-bold text-white bg-[#202020] border-[#c9a44c]/30 group-hover:bg-[#c9a44c] group-hover:text-black group-hover:border-[#c9a44c] transition-all rounded-xl h-11'
                )}
              >
                <span>Ver Planos de Aluguel</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Consignação */}
          <div className="relative group bg-[#151515] p-8 rounded-3xl border-2 border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.15)] flex flex-col justify-between hover:shadow-[0_0_30px_rgba(201,164,76,0.25)] transition-all">
            <div className="absolute -top-3.5 right-6 px-3 py-1 bg-[#c9a44c] text-black text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-sm">
              Mais Vendido
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c9a44c] text-black flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">
                Consignação Digital
              </h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Alcance o maior valor de mercado. Cuidamos das fotos profissionais, divulgação nas principais plataformas e de toda a negociação.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Você mantém o controle do valor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Showroom físico e digital premium</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/consignar-moto"
                className={cn(
                  buttonVariants(),
                  'w-full justify-between bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold rounded-xl h-11 shadow-sm'
                )}
              >
                <span>Consignar Minha Moto</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Venda */}
          <div className="relative group bg-[#151515] p-8 rounded-3xl border border-[#c9a44c]/20 shadow-sm flex flex-col justify-between hover:border-[#e3c56c]/50 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center">
                <Banknote className="w-6 h-6 text-[#e3c56c]" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">
                Venda sua Moto
              </h3>
              <p className="text-sm text-[#a6a6a1] leading-relaxed">
                Precisa vender rápido e sem dores de cabeça? Avaliamos sua moto na hora e pagamos à vista com total segurança jurídica.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Avaliação por placa em minutos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
                  <span>Pagamento via PIX no mesmo dia</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#c9a44c]/20">
              <Link
                href="/venda-sua-moto"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-between font-bold text-white bg-[#202020] border-[#c9a44c]/30 group-hover:bg-[#c9a44c] group-hover:text-black group-hover:border-[#c9a44c] transition-all rounded-xl h-11'
                )}
              >
                <span>Solicitar Avaliação</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
