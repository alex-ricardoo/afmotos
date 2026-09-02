import React from 'react';
import { Search, QrCode, FileDown, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    num: '1',
    title: 'Digite a Placa',
    desc: 'Insira os 7 dígitos da placa de qualquer veículo (moto, carro, caminhão ou utilitário).',
    icon: Search,
  },
  {
    num: '2',
    title: 'Pagamento Pix Instantâneo',
    desc: 'Confirmação rápida e liberação ágil das bases oficiais no WhatsApp.',
    icon: QrCode,
  },
  {
    num: '3',
    title: 'Link Online & PDF Oficial',
    desc: 'Abra o histórico completo pelo celular e baixe o laudo em PDF para guardar ou valorizar seu bem na venda.',
    icon: FileDown,
  },
];

interface VehicleHistoryHowItWorksProps {
  siteName?: string;
}

export function VehicleHistoryHowItWorks({ siteName = 'AF Motos' }: VehicleHistoryHowItWorksProps = {}) {
  return (
    <section className="py-10 sm:py-14 bg-[#080B11] border-t border-[#1F293D] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Simples & Rápido
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Como funciona em 3 passos
          </h2>
        </div>

        {/* Compact Numbered Sequence (Mobile-First Minimal Scroll) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#131A26] border border-[#1F293D] hover:border-amber-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black font-mono text-base flex items-center justify-center shrink-0">
                  {item.num}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-tight line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <Icon className="w-4 h-4 text-zinc-500 shrink-0 hidden sm:block" />
              </div>
            );
          })}
        </div>

        {/* Compact Store Standard Reassurance */}
        <div className="mt-4 p-4 rounded-xl bg-[#0D111A] border border-[#1F293D] flex items-start sm:items-center gap-3 text-xs text-zinc-300">
          <TrendingUp className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="text-white">Diferencial de Mercado:</strong> Ter o laudo oficial em PDF e o link interativo guardados comprova procedência, afasta compradores desconfiados e valoriza seu veículo para vender pelo preço justo!
          </span>
        </div>
      </div>
    </section>
  );
}
