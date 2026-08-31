import React from 'react';
import { Search, MessageSquareHeart, FileCheck2, ShieldCheck, UserCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Digite a Placa',
    description: 'Insira os 7 dígitos da placa no site ou inicie o contato direto pelo WhatsApp.',
    icon: Search,
    highlight: 'Rápido & Sem Cadastro',
  },
  {
    step: '02',
    title: 'Atendimento Humano & Pix',
    description: 'Um especialista da AF Motos confirma sua placa e gera a chave Pix diretamente na conversa.',
    icon: MessageSquareHeart,
    highlight: '100% Humano (Sem Robôs)',
  },
  {
    step: '03',
    title: 'Receba o Laudo em PDF',
    description: 'Nosso consultor gera a checagem oficial e envia o documento em PDF completo no seu chat.',
    icon: FileCheck2,
    highlight: 'Emissão Rápida em Minutos',
  },
];

export function VehicleHistoryHowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-[#080B11] border-t border-[#1F293D] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Atendimento Humanizado</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Como funciona a consulta em 3 passos
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Você é atendido diretamente por uma pessoa da nossa equipe. Sem formulários complexos e sem robôs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative p-6 sm:p-7 rounded-3xl bg-[#131A26] border border-[#1F293D] flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-amber-500/30 font-mono">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    {item.highlight}
                  </span>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner: Todas as motos da AF Motos possuem histórico veicular */}
        <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#131A26] to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              Padrão de Qualidade AF Motos
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <strong className="text-amber-400">100% das motos do nosso estoque passam por rigorosa consulta de histórico veicular</strong> antes de serem comercializadas. Aplicamos esse mesmo padrão de segurança para o laudo da moto que você quer consultar!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
