import React from 'react';
import { ConsignmentForm } from '@/components/forms/consignment-form';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Camera,
  TrendingUp,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';

export const metadata = {
  title: 'Consignação de Motos | AF Locações e Vendas',
  description:
    'Deixe a venda da sua moto com especialistas. Mais visibilidade, fotos profissionais, segurança e o maior valor de mercado na AF Locações e Vendas.',
};

export default function ConsignarMotoPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <TrendingUp className="w-4 h-4 text-[#e3c56c]" />
            <span>Maximize o Retorno Financeiro da sua Moto</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Consignação Digital AF Locações e Vendas
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Nós cuidamos da estética, fotos profissionais, divulgação nos maiores portais e de toda a negociação. Você recebe o melhor valor sem qualquer preocupação.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Comparison: Venda Particular vs AF Locações e Vendas */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Por que consignar com a AF Locações e Vendas?
            </h2>
            <p className="text-[#a6a6a1] text-sm mt-1">
              Compare as vantagens de deixar sua moto com uma loja especializada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Particular */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-red-500/20 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                <XCircle className="w-5 h-5" />
                <span>Venda Particular Tradicional</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[#a6a6a1]">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Risco de golpes e visitas de estranhos em sua residência</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Compradores com propostas absurdas e trocas desvantajosas</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Dificuldade para quem precisa financiar a compra</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Fotos amadoras e pouca visibilidade nos portais</span>
                </li>
              </ul>
            </div>

            {/* AF Locações e Vendas */}
            <div className="bg-[#151515] p-6 rounded-2xl border-2 border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.15)] space-y-4">
              <div className="flex items-center gap-2 text-[#e3c56c] font-bold text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-[#e3c56c]" />
                <span>Consignação AF Locações e Vendas</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[#f4f4f2] font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <span>Segurança total em showroom monitorado e periciado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <span>Fotos e vídeos profissionais de alta definição</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <span>Oferecemos financiamento bancário para o comprador final</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
                  <span>Comissão combinada previamente apenas no êxito da venda</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Proposta de Consignação
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Envie as informações da sua moto para simularmos os valores e entrarmos em contato.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <ConsignmentForm />
          </div>
        </div>
      </div>
    </div>
  );
}
