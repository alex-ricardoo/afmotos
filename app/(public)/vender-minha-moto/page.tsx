import React from 'react';
import { Metadata } from 'next';
import { VendaMotoForm } from '@/components/forms/venda-moto-form';
import { Banknote, ShieldCheck, Zap, FileCheck, Scale } from 'lucide-react';

import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';
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
    title: `Venda sua Moto para a ${siteName} | Avaliação Justa e Pagamento Seguro`,
    description: `Quer vender sua moto em Cabo de Santo Agostinho ou Pernambuco? Consulte a Tabela FIPE, simule sua proposta e venda diretamente para a ${siteName} com pagamento seguro via PIX.`,
    path: '/vender-minha-moto',
  });
}

export default async function VenderMinhaMotoPage() {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Venda sua Moto', path: '/vender-minha-moto' },
  ]);

  const faqSchema = buildFaqSchema([
    {
      question: `Por que é mais seguro vender para a ${siteName} do que em sites de terceiros?`,
      answer:
        `Vender para desconhecidos em sites de classificados traz riscos frequentes de golpes de falso comprovante, intermediários duvidosos e atrasos na transferência no DETRAN. Na ${siteName}, você negocia com uma loja física estabelecida, com total credibilidade no mercado, pagamento à vista na hora e segurança jurídica.`,
    },
    {
      question: `Como a ${siteName} avalia minha moto?`,
      answer:
        'Utilizamos a Tabela FIPE oficial atualizada como referência de mercado e avaliamos o estado de conservação, quilometragem e documentação do veículo para fazer uma proposta justa.',
    },
    {
      question: 'Como e quando recebo o pagamento da moto?',
      answer:
        'Após a vistoria presencial e conferência da documentação de transferência, o pagamento é realizado integralmente à vista via transferência bancária ou PIX.',
    },
  ]);

  return (
    <div className="bg-[#050505] min-h-screen pb-20 text-zinc-100">
      <JsonLd data={breadcrumbsSchema} id="vender-breadcrumbs-schema" />
      <JsonLd data={faqSchema} id="vender-faq-schema" />
      {/* Header Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-[#050505] py-14 sm:py-20 border-b border-zinc-800/80">
        {/* Luxury Gold Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Banknote className="w-4 h-4 text-amber-400" />
            <span>Compra Direta & Avaliação Comercial Transparente</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Venda sua moto para a {siteName}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto font-normal">
            Receba uma avaliação transparente baseada na Tabela FIPE e venda sua moto com total segurança,
            evitando golpes de sites de terceiros e contando com a credibilidade da {siteName}.
          </p>

          {/* Quick Value Pillars */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-zinc-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero risco de golpes & 100% seguro</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Avaliação de mercado baseada na FIPE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pagamento à vista e sem enrolação</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-6xl space-y-16">
        {/* Main Interactive Wizard Form */}
        <VendaMotoForm siteName={siteName} />

        {/* Institutional Trust Bar */}
        <div className="pt-6 border-t border-zinc-800/80">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">
              Por que vender sua moto para a {siteName}?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Livre-se dos riscos de golpes em sites de terceiros e classificados. Aqui você negocia direto com loja física, segurança jurídica e credibilidade comprovada no mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Benefício 1: Proteção Contra Golpes */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-emerald-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Zero Risco de Golpes
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Evite falsos comprovantes, compradores desconhecidos e golpes comuns de sites de classificados. Negocie com credibilidade e segurança total.
              </p>
            </div>

            {/* Benefício 2: Avaliação Justa na FIPE */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Avaliação Baseada no Mercado
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Utilizamos a Tabela FIPE como referência oficial e avaliamos o estado real de
                conservação da sua moto com total transparência e justiça.
              </p>
            </div>

            {/* Benefício 3: Pagamento Direto & Rápido */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Banknote className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Pagamento Direto & Sem Enrolação
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sem esperar intermediários ou compradores indecisos. Aprovada a moto, o pagamento via PIX é feito diretamente na sua conta na hora.
              </p>
            </div>

            {/* Benefício 4: Transferência Segura no DETRAN */}
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/40 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                Transferência Segura no DETRAN
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cuidamos dos procedimentos documentais e comunicação de venda para que você tenha tranquilidade jurídica total e zero dores de cabeça futuras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
