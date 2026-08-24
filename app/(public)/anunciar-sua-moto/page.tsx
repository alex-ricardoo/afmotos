import React from 'react';
import { AnunciarMotoForm } from '@/components/forms/anunciar-moto-form';
import {
  KeyRound,
  ShieldCheck,
  MessageCircle,
  FileCheck,
  FileText,
  SearchCheck,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { getSettings } from '@/lib/actions/settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  return {
    title: `Anuncie sua Moto | ${siteName}`,
    description: `Quer vender sua moto? Envie as informações e fotos para a ${siteName}. Analisamos os dados e combinamos os próximos passos diretamente pelo WhatsApp.`,
  };
}

export default async function AnunciarSuaMotoPage() {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  const steps = [
    {
      number: '1',
      icon: FileText,
      title: 'Envio dos Dados',
      description: 'Preencha as informações básicas e envie fotos da sua moto.',
    },
    {
      number: '2',
      icon: SearchCheck,
      title: 'Análise da sua Moto',
      description: 'Avaliamos a tabela FIPE e as fotos para te passar o melhor valor.',
    },
    {
      number: '3',
      icon: MessageSquare,
      title: 'Combinamos no WhatsApp',
      description: 'Conversamos com você para definir a proposta e tirar todas as dúvidas.',
    },
    {
      number: '4',
      icon: TrendingUp,
      title: 'Vendemos pra Você',
      description: 'Anunciamos para compradores reais e cuidamos de tudo até o pagamento.',
    },
  ];

  return (
    <div className="bg-[#050505] min-h-screen pb-20 text-zinc-100">
      {/* Header Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-[#050505] py-16 sm:py-20 border-b border-zinc-800/80">
        {/* Subtle Luxury Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Venda sua Moto com Facilidade e Segurança</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Anuncie sua moto com a {siteName}
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Preencha as informações abaixo e receba uma avaliação justa da nossa equipe para vender sua moto de forma rápida, simples e sem dor de cabeça.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 max-w-5xl space-y-16">
        {/* Stepper Conectado ("Como Funciona") */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Como Funciona o Processo
            </h2>
            <p className="text-zinc-400 text-sm">
              Conheça o passo a passo simples até a venda da sua moto.
            </p>
          </div>

          {/* Stepper Timeline Conectada (Desktop & Mobile) */}
          <div className="relative">
            {/* Horizontal Line Connector (Desktop) */}
            <div className="hidden md:block absolute top-7 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500 to-amber-500/40 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center group bg-zinc-950/60 md:bg-transparent p-5 md:p-0 rounded-2xl border border-zinc-800/80 md:border-none shadow-sm"
                  >
                    {/* Circle Node */}
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-amber-500 text-amber-400 font-extrabold flex items-center justify-center text-base shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-300 mb-4 relative">
                      <StepIcon className="w-6 h-6" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center border border-zinc-950">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base mb-1.5 group-hover:text-amber-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-[220px]">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Card Encapsulado com Design System Dark Luxury */}
        <div className="max-w-3xl mx-auto bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle Top Accent Border Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <AnunciarMotoForm />
        </div>

        {/* Trust Bar Institucional Unificada */}
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Avaliação Justa & Transparente</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Análise baseada no valor de mercado FIPE e no estado de conservação real da sua moto.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Atendimento Direto no WhatsApp</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sem intermediários ou burocracia. Você conversa diretamente com a nossa equipe.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/80 text-center space-y-3 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Segurança na Transferência Legal</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ajudamos com toda a documentação e transferência no DETRAN de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
