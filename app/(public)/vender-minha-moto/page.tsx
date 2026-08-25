import React from 'react';
import { Metadata } from 'next';
import { VendaMotoForm } from '@/components/forms/venda-moto-form';
import { Banknote, ShieldCheck, Zap, FileCheck, Scale } from 'lucide-react';

import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  return {
    title: `Venda sua Moto para a ${siteName} | Avaliação Justa e Pagamento Seguro`,
    description: `Quer vender sua moto com rapidez e segurança? Consulte o valor na Tabela FIPE, simule uma proposta e venda diretamente para a ${siteName} sem dor de cabeça.`,
    openGraph: {
      title: `Venda sua Moto para a ${siteName} | Avaliação Justa e Pagamento Seguro`,
      description: `Receba uma avaliação transparente e venda sua motocicleta diretamente para a ${siteName} com pagamento via PIX.`,
      type: 'website',
    },
  };
}

export default async function VenderMinhaMotoPage() {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  return (
    <div className="bg-[#050505] min-h-screen pb-20 text-zinc-100">
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
            Receba uma avaliação transparente baseada na Tabela FIPE e uma proposta rápida para
            vender sua moto com segurança e sem intermediários.
          </p>

          {/* Quick Value Pillars */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-zinc-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Avaliação de mercado baseada na FIPE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pagamento seguro e ágil</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Atendimento direto com a loja</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-6xl space-y-16">
        {/* Main Interactive Wizard Form */}
        <VendaMotoForm siteName={siteName} />

        {/* Institutional Trust Bar */}
        <div className="pt-6 border-t border-zinc-800/80">
          <div className="text-center max-w-md mx-auto mb-8 space-y-1.5">
            <h3 className="text-xl font-bold text-white font-heading">
              Por que vender sua moto para a {siteName}?
            </h3>
            <p className="text-xs text-zinc-400">
              Compromisso com honestidade, agilidade e segurança jurídica em cada negociação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Avaliação Baseada no Mercado</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Utilizamos a Tabela FIPE como referência oficial e avaliamos o estado real de
                conservação da sua moto com total clareza.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Banknote className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">
                Pagamento Direto & Sem Enrolação
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sem esperar terceiros ou compradores indecisos. Aprovada a moto, o pagamento é feito
                diretamente na sua conta.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Transferência Segura no DETRAN</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cuidamos dos procedimentos documentais para que a transferência de propriedade
                ocorra com total tranquilidade jurídica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
