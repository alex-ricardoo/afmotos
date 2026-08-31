import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  Zap,
  DollarSign,
  FileCheck2,
} from 'lucide-react';

export function VehicleHistoryReasons() {
  return (
    <section className="py-16 sm:py-24 bg-zinc-900/30 border-t border-white/5 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>Vantagem Para Todos os Lados</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            O histórico veicular protege quem compra e valoriza quem vende
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            A transparência documental acelera negociações e elimina desconfianças na compra e venda de motocicletas.
          </p>
        </div>

        {/* Dual Pillar Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card: Para Quem Vai Comprar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Para Quem Quer Comprar
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Compre Sem Medo de Golpes
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Descubra a verdade sobre a moto antes de pagar sinal ou assinar o recibo de transferência.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Cheque se há ocorrências ativas de roubo, furto ou sinistros.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Verifique se a moto é de leilão ou possui alienação fiduciária.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Descubra débitos de IPVA e multas para abater no preço final.</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
              💡 Evite surpresas e negocie sabendo exatamente a situação jurídica da moto.
            </div>
          </div>

          {/* Card: Para Quem Vai Vender ou Já Tem a Moto */}
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Para Quem Quer Vender ou Já Tem a Moto
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Valorize Sua Moto na Venda
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Mostre o laudo limpo para interessados, transmita confiança e feche a venda muito mais rápido.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Passe credibilidade imediata ao enviar o laudo em PDF para o comprador.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <DollarSign className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Defenda o valor do seu anúncio comprovando que a moto não tem restrições.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Cheque e regularize qualquer pendência antiga na sua própria motocicleta.</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
              🚀 Anúncios com laudo de procedência atraem compradores mais qualificados e decididos.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
